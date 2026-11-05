from fastapi import APIRouter, Body, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import List
from models import Customer, CustomerCreate, CustomerUpdate
from bson import ObjectId

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.post("/", response_description="Add new customer", status_code=status.HTTP_201_CREATED, response_model=Customer)
async def create_customer(request: Request, customer: CustomerCreate = Body(...)):
    customer_dict = customer.model_dump()
    new_customer = await request.app.mongodb["customers"].insert_one(customer_dict)
    created_customer = await request.app.mongodb["customers"].find_one(
        {"_id": new_customer.inserted_id}
    )
    return created_customer

@router.get("/", response_description="List all customers", response_model=List[Customer])
async def list_customers(request: Request):
    customers = await request.app.mongodb["customers"].find().to_list(1000)
    return customers

@router.get("/{id}", response_description="Get a single customer", response_model=Customer)
async def show_customer(id: str, request: Request):
    if (customer := await request.app.mongodb["customers"].find_one({"_id": ObjectId(id)})) is not None:
        return customer
    raise HTTPException(status_code=404, detail=f"Customer {id} not found")

@router.put("/{id}", response_description="Update a customer", response_model=Customer)
async def update_customer(id: str, request: Request, customer: CustomerUpdate = Body(...)):
    customer_dict = {k: v for k, v in customer.model_dump().items() if v is not None}

    if len(customer_dict) >= 1:
        update_result = await request.app.mongodb["customers"].update_one(
            {"_id": ObjectId(id)}, {"$set": customer_dict}
        )

        if update_result.modified_count == 1:
            if (
                updated_customer := await request.app.mongodb["customers"].find_one({"_id": ObjectId(id)})
            ) is not None:
                return updated_customer

    if (existing_customer := await request.app.mongodb["customers"].find_one({"_id": ObjectId(id)})) is not None:
        return existing_customer

    raise HTTPException(status_code=404, detail=f"Customer {id} not found")

@router.delete("/{id}", response_description="Delete a customer")
async def delete_customer(id: str, request: Request):
    delete_result = await request.app.mongodb["customers"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    raise HTTPException(status_code=404, detail=f"Customer {id} not found")
