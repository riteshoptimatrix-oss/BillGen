import os
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
import aiofiles

from models import Product, ProductCreate, ProductUpdate
from security import get_current_user, validate_uploaded_file

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("/upload", response_description="Upload a product image")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Secure file upload with multi-tier validation:
    - Extension whitelist (.jpg, .jpeg, .png, .webp)
    - Magic byte header verification
    - 10MB size ceiling
    - UUID sanitization
    """
    content = await file.read()
    validate_uploaded_file(
        filename=file.filename or "upload.jpg",
        content_type=file.content_type or "",
        content=content,
        is_image_only=True
    )
    
    ext = os.path.splitext(file.filename or "img.jpg")[1].lower()
    if not ext:
        ext = ".jpg"
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    upload_dir = os.path.abspath("uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)
        
    base_url = str(request.base_url).rstrip("/")
    return {
        "url": f"{base_url}/uploads/{unique_filename}",
        "path": f"/uploads/{unique_filename}"
    }

@router.post("/", response_description="Add new product", response_model=Product)
async def create_product(
    request: Request,
    product: ProductCreate = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
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
        raise HTTPException(status_code=400, detail="Invalid Product ID format")
    product = await request.app.mongodb["products"].find_one({"_id": ObjectId(id)})
    if product is not None:
        return product
    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@router.put("/{id}", response_description="Update a product", response_model=Product)
async def update_product(
    id: str,
    request: Request,
    product: ProductUpdate = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Product ID format")
    
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
async def delete_product(
    id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Product ID format")
    
    delete_result = await request.app.mongodb["products"].delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
    
    raise HTTPException(status_code=404, detail=f"Product {id} not found")
