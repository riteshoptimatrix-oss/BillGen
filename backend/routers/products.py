from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import List
from bson import ObjectId
import os
import uuid
import aiofiles

from models import Product, ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("/upload", response_description="Upload a product image")
async def upload_image(file: UploadFile = File(...)):
    # Create unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    # Save the file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    return {"url": f"http://localhost:8000/uploads/{unique_filename}"}

@router.post("/", response_description="Add new product", response_model=Product)
async def create_product(request: Request, product: ProductCreate = Body(...)):
    product_dict = jsonable_encoder(product)
    new_product = await request.app.mongodb["products"].insert_one(product_dict)
    created_product = await request.app.mongodb["products"].find_one(
        {"_id": new_product.inserted_id}
    )
    return created_product

@router.get("/", response_description="List all products", response_model=List[Product])
async def list_products(request: Request):
    products = await request.app.mongodb["products"].find().to_list(1000)
    return products

@router.get("/{id}", response_description="Get a single product", response_model=Product)
async def show_product(id: str, request: Request):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    product = await request.app.mongodb["products"].find_one({"_id": ObjectId(id)})
    if product is not None:
        return product
    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@router.put("/{id}", response_description="Update a product", response_model=Product)
async def update_product(id: str, request: Request, product: ProductUpdate = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    product_dict = {k: v for k, v in product.model_dump().items() if v is not None}
    
    if len(product_dict) >= 1:
        update_result = await request.app.mongodb["products"].update_one(
            {"_id": ObjectId(id)}, {"$set": product_dict}
        )
        if update_result.modified_count == 1:
            updated_product = await request.app.mongodb["products"].find_one({"_id": ObjectId(id)})
            if updated_product is not None:
                return updated_product
                
    existing_product = await request.app.mongodb["products"].find_one({"_id": ObjectId(id)})
    if existing_product is not None:
        return existing_product
    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@router.delete("/{id}", response_description="Delete a product")
async def delete_product(id: str, request: Request):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    delete_result = await request.app.mongodb["products"].delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
    
    raise HTTPException(status_code=404, detail=f"Product {id} not found")
