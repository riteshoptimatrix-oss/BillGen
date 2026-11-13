from fastapi import APIRouter, Body, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import logging
from models import Customer, CustomerCreate, CustomerUpdate, serialize_mongo_doc
from bson import ObjectId
from security import get_optional_user

logger = logging.getLogger("customers")

router = APIRouter(prefix="/api/customers", tags=["customers"], dependencies=[Depends(get_optional_user)])

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_description="Add new customer", status_code=status.HTTP_201_CREATED)
async def create_customer(
    request: Request,
    customer: CustomerCreate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    customer_dict = customer.model_dump()
    new_customer = await request.app.mongodb["customers"].insert_one(customer_dict)
    created_customer = await request.app.mongodb["customers"].find_one(
        {"_id": new_customer.inserted_id}
    )

    clean_cust = serialize_mongo_doc(created_customer) or {}

    # Real-Time Broadcast Notification
    try:
        from routers.notifications import broadcast_notification
        c_name = clean_cust.get("name", "Customer")
        await broadcast_notification(
            request.app.mongodb,
            title="New Customer Registered",
            message=f"{c_name} added to party directory",
            type="customer",
            link="/customers"
        )
    except Exception:
        pass

    return clean_cust

@router.get("", include_in_schema=False)
@router.get("/", response_description="List all customers")
async def list_customers(request: Request) -> List[Dict[str, Any]]:
    try:
        customers = await request.app.mongodb["customers"].find().sort("_id", -1).to_list(1000)
        return [serialize_mongo_doc(c) for c in customers if c]
    except Exception as e:
        logger.error(f"Error fetching customers: {e}", exc_info=True)
        try:
            customers = await request.app.mongodb["customers"].find().to_list(1000)
            return [serialize_mongo_doc(c) for c in customers if c]
        except Exception:
            return []

@router.get("/{id}", response_description="Get a single customer")
async def show_customer(id: str, request: Request) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Customer ID format")
    customer = await request.app.mongodb["customers"].find_one({"_id": ObjectId(id)})
    if customer is not None:
        return serialize_mongo_doc(customer)
    raise HTTPException(status_code=404, detail=f"Customer {id} not found")

@router.put("/{id}", response_description="Update a customer")
async def update_customer(
    id: str,
    request: Request,
    customer: CustomerUpdate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Customer ID format")
    customer_dict = {k: v for k, v in customer.model_dump().items() if v is not None}

    if len(customer_dict) >= 1:
        await request.app.mongodb["customers"].update_one(
            {"_id": ObjectId(id)}, {"$set": customer_dict}
        )

    updated_customer = await request.app.mongodb["customers"].find_one({"_id": ObjectId(id)})
    if updated_customer is not None:
        return serialize_mongo_doc(updated_customer)

    raise HTTPException(status_code=404, detail=f"Customer {id} not found")

@router.delete("/{id}", response_description="Delete a customer")
async def delete_customer(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Customer ID format")
    delete_result = await request.app.mongodb["customers"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    raise HTTPException(status_code=404, detail=f"Customer {id} not found")
