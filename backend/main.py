import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup MongoDB connection lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB using env vars
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "bill_generator_db")
    
    app.mongodb_client = AsyncIOMotorClient(mongodb_url)
    app.mongodb = app.mongodb_client.get_database(db_name)
    print(f"Connected to MongoDB database: {db_name}")
    yield
    # Close connection
    app.mongodb_client.close()
    print("Disconnected from MongoDB.")

from fastapi.staticfiles import StaticFiles
from routers import products, labours, dashboard, customers, invoices, purchases, finance, reports

app = FastAPI(title="Bill Generator API", lifespan=lifespan)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory as static files
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(products.router)
app.include_router(labours.router)
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(purchases.router)
app.include_router(finance.router)
app.include_router(reports.router)

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bill Generator API"}

@app.post("/api/auth/login")
def login(request: LoginRequest):
    # Hardcoded credentials as requested
    if request.email == "ritesh.work.1510@gmail.com" and request.password == "8980614160@.com":
        return {"status": "success", "token": "dummy-token-12345", "user": {"email": request.email}}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")
