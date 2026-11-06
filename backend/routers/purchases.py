from fastapi import APIRouter, Body, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
from models import Purchase, PurchaseCreate, PurchaseUpdate
from bson import ObjectId
from datetime import datetime
from security import get_current_user

router = APIRouter(prefix="/api/purchases", tags=["purchases"], dependencies=[Depends(get_current_user)])

@router.post("/", response_description="Add a new purchase entry", status_code=status.HTTP_201_CREATED, response_model=Purchase)
async def create_purchase(
    request: Request,
    purchase: PurchaseCreate = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    purchase_dict = purchase.model_dump()
    
    if not purchase_dict.get("purchase_date"):
        purchase_dict["purchase_date"] = datetime.now().strftime("%Y-%m-%d")
        
    new_purchase = await request.app.mongodb["purchases"].insert_one(purchase_dict)
    created_purchase = await request.app.mongodb["purchases"].find_one({"_id": new_purchase.inserted_id})
    return created_purchase

@router.get("/", response_description="List all purchase entries", response_model=List[Purchase])
async def list_purchases(request: Request):
    purchases = await request.app.mongodb["purchases"].find().sort("_id", -1).to_list(1000)
    return purchases

@router.get("/summary", response_description="Get purchase statistics")
async def purchase_summary(request: Request) -> Dict[str, Any]:
    purchases = await request.app.mongodb["purchases"].find().to_list(1000)
    total_amount = sum(p.get("amount", 0) for p in purchases)
    paid_amount = sum(p.get("amount", 0) for p in purchases if p.get("status") == "Paid")
    pending_amount = sum(p.get("amount", 0) for p in purchases if p.get("status") in ["Pending", "Overdue"])
    
    return {
        "totalPurchases": total_amount,
        "paidPurchases": paid_amount,
        "pendingPurchases": pending_amount,
        "count": len(purchases)
    }

@router.get("/{id}", response_description="Get a single purchase entry", response_model=Purchase)
async def show_purchase(id: str, request: Request):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Purchase ID format")
    if (purchase := await request.app.mongodb["purchases"].find_one({"_id": ObjectId(id)})) is not None:
        return purchase
    raise HTTPException(status_code=404, detail=f"Purchase {id} not found")

@router.put("/{id}", response_description="Update a purchase entry", response_model=Purchase)
async def update_purchase(
    id: str,
    request: Request,
    purchase: PurchaseUpdate = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Purchase ID format")
        
    purchase_dict = {k: v for k, v in purchase.model_dump().items() if v is not None}

    if len(purchase_dict) >= 1:
        await request.app.mongodb["purchases"].update_one(
            {"_id": ObjectId(id)}, {"$set": purchase_dict}
        )

    if (updated_purchase := await request.app.mongodb["purchases"].find_one({"_id": ObjectId(id)})) is not None:
        return updated_purchase

    raise HTTPException(status_code=404, detail=f"Purchase {id} not found")

@router.delete("/{id}", response_description="Delete a purchase entry")
async def delete_purchase(
    id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Purchase ID format")
        
    delete_result = await request.app.mongodb["purchases"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    raise HTTPException(status_code=404, detail=f"Purchase {id} not found")
