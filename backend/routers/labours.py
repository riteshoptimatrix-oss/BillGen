from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import List
from bson import ObjectId
import os
import uuid
import aiofiles

from models import Labour, LabourCreate, LabourUpdate

router = APIRouter(prefix="/api/labours", tags=["labours"])

@router.post("/upload", response_description="Upload a labour image")
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

@router.post("/", response_description="Add new labour", response_model=Labour)
async def create_labour(request: Request, labour: LabourCreate = Body(...)):
    labour_dict = jsonable_encoder(labour)
    new_labour = await request.app.mongodb["labours"].insert_one(labour_dict)
    created_labour = await request.app.mongodb["labours"].find_one(
        {"_id": new_labour.inserted_id}
    )
    return created_labour

@router.get("/", response_description="List all labours", response_model=List[Labour])
async def list_labours(request: Request):
    labours = await request.app.mongodb["labours"].find().to_list(1000)
    return labours

@router.get("/{id}", response_description="Get a single labour", response_model=Labour)
async def show_labour(id: str, request: Request):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    labour = await request.app.mongodb["labours"].find_one({"_id": ObjectId(id)})
    if labour is not None:
        return labour
    raise HTTPException(status_code=404, detail=f"Labour {id} not found")

@router.put("/{id}", response_description="Update a labour", response_model=Labour)
async def update_labour(id: str, request: Request, labour: LabourUpdate = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    labour_dict = {k: v for k, v in labour.model_dump().items() if v is not None}
    
    if len(labour_dict) >= 1:
        update_result = await request.app.mongodb["labours"].update_one(
            {"_id": ObjectId(id)}, {"$set": labour_dict}
        )
        if update_result.modified_count == 1:
            updated_labour = await request.app.mongodb["labours"].find_one({"_id": ObjectId(id)})
            if updated_labour is not None:
                return updated_labour
                
    existing_labour = await request.app.mongodb["labours"].find_one({"_id": ObjectId(id)})
    if existing_labour is not None:
        return existing_labour
    raise HTTPException(status_code=404, detail=f"Labour {id} not found")

@router.delete("/{id}", response_description="Delete a labour")
async def delete_labour(id: str, request: Request):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    delete_result = await request.app.mongodb["labours"].delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
    
    raise HTTPException(status_code=404, detail=f"Labour {id} not found")
