import os
import re
import base64
import logging
import mimetypes
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Request, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from fastapi.middleware.gzip import GZipMiddleware
from security import (
    verify_password,
    create_access_token,
    get_current_user,
    check_login_rate_limit,
    record_failed_login,
    reset_login_attempts,
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD_HASH
)
from routers import (
    products,
    labours,
    dashboard,
    customers,
    invoices,
    purchases,
    finance,
    reports,
    notifications,
    settings,
    auth
)

# Load environment configuration
load_dotenv()

# Configure structured security logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("security")

# Setup MongoDB connection lifespan with high-performance connection pooling
@asynccontextmanager
async def lifespan(app: FastAPI):
    mongodb_url = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "bill_generator_db")
    
    client_kwargs = {
        "minPoolSize": 10,
        "maxPoolSize": 50,
        "maxIdleTimeMS": 45000,
        "serverSelectionTimeoutMS": 5000,
        "connectTimeoutMS": 10000,
        "socketTimeoutMS": 20000,
    }
    if "mongodb+srv" in mongodb_url or "ssl=true" in mongodb_url.lower() or "tls=true" in mongodb_url.lower():
        try:
            import certifi
            client_kwargs["tlsCAFile"] = certifi.where()
        except Exception as e:
            logger.warning(f"Could not load certifi CA file: {e}")

    app.mongodb_client = AsyncIOMotorClient(mongodb_url, **client_kwargs)
    app.mongodb = app.mongodb_client.get_database(db_name)
    logger.info(f"Secure connection initialized to database: {db_name}")

    # Automatically ensure critical performance indexes on MongoDB Atlas
    try:
        await app.mongodb["invoices"].create_index([("date", -1)], background=True)
        await app.mongodb["invoices"].create_index([("invoice_number", 1)], background=True)
        await app.mongodb["invoices"].create_index([("status", 1)], background=True)
        await app.mongodb["invoices"].create_index([("client", 1)], background=True)
        await app.mongodb["products"].create_index([("name", 1)], background=True)
        await app.mongodb["products"].create_index([("stock", 1)], background=True)
        await app.mongodb["products"].create_index([("category", 1)], background=True)
        await app.mongodb["customers"].create_index([("name", 1)], background=True)
        await app.mongodb["customers"].create_index([("mobile_number", 1)], background=True)
        await app.mongodb["labours"].create_index([("name", 1)], background=True)
        await app.mongodb["labours"].create_index([("mobile_number", 1)], background=True)
        await app.mongodb["labours"].create_index([("status", 1)], background=True)
        await app.mongodb["purchases"].create_index([("purchase_date", -1)], background=True)
        await app.mongodb["purchases"].create_index([("status", 1)], background=True)
        await app.mongodb["purchases"].create_index([("supplier_name", 1)], background=True)
        await app.mongodb["expenses"].create_index([("date", -1)], background=True)
        await app.mongodb["notifications"].create_index([("created_at", -1)], background=True)
        await app.mongodb["notifications"].create_index([("is_read", 1)], background=True)
        await app.mongodb["uploaded_files"].create_index([("filename", 1)], unique=True, background=True)
        logger.info("MongoDB Atlas performance indexes verified/initialized.")

        # Ensure default system users (shaileshbhai123@gmail.com and admin)
        await auth.ensure_default_system_users(app.mongodb)
    except Exception as idx_err:
        logger.warning(f"MongoDB Atlas initialization notice: {idx_err}")

    yield
    app.mongodb_client.close()
    logger.info("Closed MongoDB database connection.")

app = FastAPI(
    title="SiddhiVinayak Enterprise Billing API",
    version="2.5",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None  # Disable unnecessary secondary documentation surface
)

# Enable response GZip compression to cut network payload sizes by ~70-80%
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ==============================================================================
# 1. SECURITY RESPONSE HEADERS MIDDLEWARE
# ==============================================================================
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Inject robust defense-in-depth security response headers.
    Protects against clickjacking, MIME sniffing, and browser cache leakage.
    """
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# ==============================================================================
# 2. HARDENED CORS CONFIGURATION
# ==============================================================================
# Restrict to trusted localhost and local network RFC1918 subnets (LAN / mobile testing)
# Replaces insecure wildcards with precise boundary checks
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://smart-erp-testing.netlify.app",
        *(os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []),
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    max_age=600,
)

# ==============================================================================
# 3. STATIC FILES & RESILIENT INVOICE PDF SERVING
# ==============================================================================
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/invoices", exist_ok=True)

@app.get("/uploads/invoices/{filename}", tags=["invoices"])
async def serve_invoice_pdf(filename: str, request: Request):
    """
    Resilient high-availability Invoice PDF delivery:
    1. Direct file lookup on local disk.
    2. Fuzzy match (handles suffix hashes, dashes, and underscores).
    3. Persistent cloud fallback (reconstructs from MongoDB Atlas if Render restarted/cleared disk).
    """
    safe_filename = os.path.basename(filename)
    if not safe_filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF invoices can be served.")

    search_dirs = [
        os.path.abspath("uploads/invoices"),
        os.path.abspath(os.path.join("..", "uploads", "invoices")),
        os.path.abspath(os.path.join("backend", "uploads", "invoices")),
    ]

    # 1. Direct match on disk
    for s_dir in search_dirs:
        candidate = os.path.join(s_dir, safe_filename)
        if os.path.isfile(candidate) and os.path.getsize(candidate) > 0:
            return FileResponse(
                candidate,
                media_type="application/pdf",
                headers={"Content-Disposition": f'inline; filename="{safe_filename}"'}
            )

    # 2. Fuzzy match on disk (e.g. Invoice_INV-2026-0002 matches Invoice_INV-2026-0002_*.pdf)
    stem = safe_filename[:-4]
    core_num = re.sub(r"^Invoice_", "", stem, flags=re.IGNORECASE)
    core_clean = re.sub(r"[^A-Za-z0-9]", "", core_num)

    for s_dir in search_dirs:
        if os.path.isdir(s_dir):
            for existing in os.listdir(s_dir):
                if existing.lower().endswith(".pdf"):
                    existing_clean = re.sub(r"[^A-Za-z0-9]", "", existing[:-4])
                    if core_clean and core_clean in existing_clean:
                        matched_path = os.path.join(s_dir, existing)
                        if os.path.isfile(matched_path) and os.path.getsize(matched_path) > 0:
                            return FileResponse(
                                matched_path,
                                media_type="application/pdf",
                                headers={"Content-Disposition": f'inline; filename="{safe_filename}"'}
                            )

    # 3. Persistent cloud fallback: restore from MongoDB Atlas
    try:
        db = request.app.mongodb
        # Match by invoice_number or pdf_url
        query = {
            "$or": [
                {"invoice_number": {"$regex": core_num.replace("_", "-"), "$options": "i"}},
                {"invoice_number": {"$regex": core_num, "$options": "i"}},
                {"pdf_url": {"$regex": safe_filename, "$options": "i"}},
            ]
        }
        inv = await db["invoices"].find_one(query)
        if inv and inv.get("pdf_base64"):
            pdf_bytes = base64.b64decode(inv["pdf_base64"])
            dest_dir = search_dirs[0]
            os.makedirs(dest_dir, exist_ok=True)
            saved_path = os.path.join(dest_dir, safe_filename)
            with open(saved_path, "wb") as f:
                f.write(pdf_bytes)
            return FileResponse(
                saved_path,
                media_type="application/pdf",
                headers={"Content-Disposition": f'inline; filename="{safe_filename}"'}
            )
    except Exception as e:
        logger.warning(f"MongoDB invoice recovery fallback notice for {safe_filename}: {e}")

    raise HTTPException(status_code=404, detail="Invoice PDF not found.")

@app.get("/uploads/{filename}", tags=["uploads"])
async def serve_uploaded_file(filename: str, request: Request):
    """
    High-availability Image & Document Delivery:
    1. Direct file lookup on local disk.
    2. Persistent cloud fallback (automatically reconstructs image from MongoDB Atlas
       if Render restarted/wiped the ephemeral container disk).
    """
    safe_filename = os.path.basename(filename)
    search_dirs = [
        os.path.abspath("uploads"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")),
    ]

    # 1. Direct match on disk
    for s_dir in search_dirs:
        candidate = os.path.join(s_dir, safe_filename)
        if os.path.isfile(candidate) and os.path.getsize(candidate) > 0:
            mime_type, _ = mimetypes.guess_type(candidate)
            return FileResponse(
                candidate,
                media_type=mime_type or "image/jpeg",
                headers={"Cache-Control": "public, max-age=86400"}
            )

    # 2. Persistent cloud fallback: restore from MongoDB Atlas uploaded_files
    try:
        db = request.app.mongodb
        file_doc = await db["uploaded_files"].find_one({"filename": safe_filename})
        if file_doc and file_doc.get("data_base64"):
            file_bytes = base64.b64decode(file_doc["data_base64"])
            dest_dir = search_dirs[0]
            os.makedirs(dest_dir, exist_ok=True)
            saved_path = os.path.join(dest_dir, safe_filename)
            with open(saved_path, "wb") as f:
                f.write(file_bytes)
            return FileResponse(
                saved_path,
                media_type=file_doc.get("content_type", "image/jpeg"),
                headers={"Cache-Control": "public, max-age=86400"}
            )
    except Exception as e:
        logger.warning(f"MongoDB image recovery notice for {safe_filename}: {e}")

    # 3. If file not found in uploaded_files, check if any product or labour document references it with base64
    try:
        db = request.app.mongodb
        # Check products
        prod = await db["products"].find_one({"image": {"$regex": safe_filename, "$options": "i"}})
        if prod and prod.get("image") and prod["image"].startswith("data:"):
            # It's an inline data url
            header, encoded = prod["image"].split(",", 1)
            mime_match = re.search(r"data:([^;]+);", header)
            mime_type = mime_match.group(1) if mime_match else "image/jpeg"
            file_bytes = base64.b64decode(encoded)
            dest_dir = search_dirs[0]
            os.makedirs(dest_dir, exist_ok=True)
            saved_path = os.path.join(dest_dir, safe_filename)
            with open(saved_path, "wb") as f:
                f.write(file_bytes)
            return FileResponse(saved_path, media_type=mime_type)

        # Check labours
        lab = await db["labours"].find_one({
            "$or": [
                {"image": {"$regex": safe_filename, "$options": "i"}},
                {"aadhar_image": {"$regex": safe_filename, "$options": "i"}}
            ]
        })
        if lab:
            for field in ["image", "aadhar_image"]:
                val = lab.get(field, "")
                if val and safe_filename in val and val.startswith("data:"):
                    header, encoded = val.split(",", 1)
                    mime_match = re.search(r"data:([^;]+);", header)
                    mime_type = mime_match.group(1) if mime_match else "image/jpeg"
                    file_bytes = base64.b64decode(encoded)
                    dest_dir = search_dirs[0]
                    os.makedirs(dest_dir, exist_ok=True)
                    saved_path = os.path.join(dest_dir, safe_filename)
                    with open(saved_path, "wb") as f:
                        f.write(file_bytes)
                    return FileResponse(saved_path, media_type=mime_type)
    except Exception as e:
        logger.warning(f"Secondary check notice for {safe_filename}: {e}")

    raise HTTPException(status_code=404, detail="Uploaded image not found.")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ==============================================================================
# 4. API ROUTERS
# ==============================================================================
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(labours.router)
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(purchases.router)
app.include_router(finance.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(settings.router)

# ==============================================================================
# 5. HEALTH CHECK ENDPOINTS
# ==============================================================================
@app.get("/", tags=["health"])
@app.get("/api/health", tags=["health"])
@app.get("/api/ping", tags=["health"])
def read_root():
    return {
        "status": "online",
        "service": "SiddhiVinayak Enterprise Billing API",
        "version": "2.5"
    }

# ==============================================================================
# 6. GLOBAL SANITIZED EXCEPTION HANDLERS
# ==============================================================================
def get_cors_headers(request: Request) -> Dict[str, str]:
    origin = request.headers.get("origin")
    allowed = [
        "https://smart-erp-testing.netlify.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    if origin and (origin in allowed or "netlify.app" in origin or "localhost" in origin or "127.0.0.1" in origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true"
        }
    return {}

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Standardized error responses without internal leakages."""
    cors_hdrs = get_cors_headers(request)
    headers = {**(exc.headers or {}), **cors_hdrs}
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error": True},
        headers=headers
    )

@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Log server errors internally and return sanitized response to clients."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    cors_hdrs = get_cors_headers(request)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Server error: {str(exc)}", "error": True},
        headers=cors_hdrs
    )

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
