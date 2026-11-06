import os
import re
import base64
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Request, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

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
    reports
)

# Load environment configuration
load_dotenv()

# Configure structured security logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("security")

# Setup MongoDB connection lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    mongodb_url = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "bill_generator_db")
    
    client_kwargs = {}
    try:
        import certifi
        client_kwargs["tlsCAFile"] = certifi.where()
    except Exception as e:
        logger.warning(f"Could not load certifi CA file: {e}")

    app.mongodb_client = AsyncIOMotorClient(mongodb_url, **client_kwargs)
    app.mongodb = app.mongodb_client.get_database(db_name)
    logger.info(f"Secure connection initialized to database: {db_name}")
    yield
    app.mongodb_client.close()
    logger.info("Closed MongoDB database connection.")

app = FastAPI(
    title="SiddhiVinayak Enterprise Billing API",
    version="2.4",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None  # Disable unnecessary secondary documentation surface
)

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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ==============================================================================
# 4. API ROUTERS
# ==============================================================================
app.include_router(products.router)
app.include_router(labours.router)
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(purchases.router)
app.include_router(finance.router)
app.include_router(reports.router)

# ==============================================================================
# 5. AUTHENTICATION SCHEMAS & ENDPOINTS
# ==============================================================================
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email address")
    password: str = Field(..., min_length=4, max_length=128, description="User password")

class LoginResponse(BaseModel):
    status: str
    token: str
    user: Dict[str, Any]

@app.get("/", tags=["health"])
def read_root():
    return {
        "status": "online",
        "service": "SiddhiVinayak Enterprise Billing API",
        "version": "2.4"
    }

@app.post("/api/auth/login", response_model=LoginResponse, tags=["auth"])
async def login(credentials: LoginRequest, request: Request, response: Response):
    """
    Secure login endpoint:
    - Enforces IP-based brute-force throttling (max 5 failed attempts per min).
    - Verifies credentials using bcrypt cryptographic hashes.
    - Issues cryptographically signed HS256 JWT access tokens.
    - Sets secure SameSite cookies in addition to returning token in payload.
    """
    client_ip = request.client.host if request.client else "unknown"
    
    # 1. Check rate limit
    check_login_rate_limit(client_ip)
    
    email = credentials.email.strip().lower()
    password = credentials.password
    
    # 2. Check credentials against configured admin or database
    is_valid = False
    admin_email = DEFAULT_ADMIN_EMAIL.strip().lower()
    
    if email == admin_email:
        # Verify via bcrypt hash
        if verify_password(password, DEFAULT_ADMIN_PASSWORD_HASH):
            is_valid = True
        # Environment override if configured in production
        elif os.getenv("ADMIN_PASSWORD") and password == os.getenv("ADMIN_PASSWORD"):
            is_valid = True
            
    if not is_valid:
        record_failed_login(client_ip)
        logger.warning(f"Failed login attempt for user '{email}' from IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    # Reset attempt tracker upon success
    reset_login_attempts(client_ip)
    logger.info(f"Successful authenticated session established for: {email} ({client_ip})")
    
    # 3. Create signed JWT access token
    token = create_access_token(data={
        "sub": email,
        "role": "admin",
        "name": "SiddhiVinayak Admin"
    })
    
    # 4. Set HttpOnly cookie for defense-in-depth against XSS token harvesting
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True when hosted behind production HTTPS
        max_age=86400  # 24 hours
    )
    
    return {
        "status": "success",
        "token": token,
        "user": {
            "email": email,
            "role": "admin",
            "name": "SiddhiVinayak Admin"
        }
    }

@app.get("/api/auth/me", tags=["auth"])
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Validates active JWT token and returns verified identity profile."""
    return {"status": "authenticated", "user": user}

@app.post("/api/auth/logout", tags=["auth"])
async def logout(response: Response):
    """Clear session authentication cookies."""
    response.delete_cookie(key="access_token")
    return {"status": "success", "message": "Logged out successfully."}

# ==============================================================================
# 6. GLOBAL SANITIZED EXCEPTION HANDLERS
# ==============================================================================
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Standardized error responses without internal leakages."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error": True},
        headers=exc.headers or {}
    )

@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Log server errors internally and return sanitized response to clients."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Our engineering team has been notified.", "error": True}
    )

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
