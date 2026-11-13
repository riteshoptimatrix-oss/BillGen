import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
import aiofiles

from models import Product, ProductCreate, ProductUpdate, serialize_mongo_doc
from security import get_optional_user, validate_uploaded_file

router = APIRouter(prefix="/api/products", tags=["products"], dependencies=[Depends(get_optional_user)])

@router.post("/upload", response_description="Upload a product image")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
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
    
    upload_dirs = [
        os.path.abspath("uploads"),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads"))
    ]
    for d in upload_dirs:
        try:
            os.makedirs(d, exist_ok=True)
            async with aiofiles.open(os.path.join(d, unique_filename), "wb") as out_file:
                await out_file.write(content)
        except Exception:
            pass
        
    base_url = str(request.base_url).rstrip("/")
    return {
        "url": f"{base_url}/uploads/{unique_filename}",
        "path": f"/uploads/{unique_filename}",
        "filename": unique_filename
    }

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_description="Add new product", status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
    product: ProductCreate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    product_dict = jsonable_encoder(product)
    new_product = await request.app.mongodb["products"].insert_one(product_dict)
    created_product = await request.app.mongodb["products"].find_one(
        {"_id": new_product.inserted_id}
    )

    clean_prod = serialize_mongo_doc(created_product) or {}

    # Real-Time Broadcast Notification
    try:
        from routers.notifications import broadcast_notification
        p_name = clean_prod.get("name", "Product")
        stock_cnt = clean_prod.get("stock", 0)
        await broadcast_notification(
            request.app.mongodb,
            title=f"New Product Added: {p_name}",
            message=f"Added to catalog with {stock_cnt} units stock",
            type="stock",
            link="/products"
        )
    except Exception:
        pass

    return clean_prod

@router.get("", include_in_schema=False)
@router.get("/", response_description="List all products")
async def list_products(request: Request) -> List[Dict[str, Any]]:
    try:
        products = await request.app.mongodb["products"].find().to_list(1000)
        return [serialize_mongo_doc(p) for p in products if p]
    except Exception:
        return []

@router.get("/{id}", response_description="Get a single product")
async def show_product(id: str, request: Request) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Product ID format")
    product = await request.app.mongodb["products"].find_one({"_id": ObjectId(id)})
    if product is not None:
        return serialize_mongo_doc(product)
    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@router.put("/{id}", response_description="Update a product")
async def update_product(
    id: str,
    request: Request,
    product: ProductUpdate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Product ID format")
    
    product_dict = {k: v for k, v in product.model_dump().items() if v is not None}
    
    if len(product_dict) >= 1:
        await request.app.mongodb["products"].update_one(
            {"_id": ObjectId(id)}, {"$set": product_dict}
        )
                
    updated_product = await request.app.mongodb["products"].find_one({"_id": ObjectId(id)})
    if updated_product is not None:
        return serialize_mongo_doc(updated_product)
    raise HTTPException(status_code=404, detail=f"Product {id} not found")

@router.delete("/{id}", response_description="Delete a product")
async def delete_product(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Product ID format")
    
    delete_result = await request.app.mongodb["products"].delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
    
    raise HTTPException(status_code=404, detail=f"Product {id} not found")
