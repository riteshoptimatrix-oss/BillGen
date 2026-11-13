from fastapi import APIRouter, Body, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from models import Purchase, PurchaseCreate, PurchaseUpdate, serialize_mongo_doc
from bson import ObjectId
from datetime import datetime
from security import get_optional_user

router = APIRouter(prefix="/api/purchases", tags=["purchases"], dependencies=[Depends(get_optional_user)])

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_description="Add a new purchase entry", status_code=status.HTTP_201_CREATED)
async def create_purchase(
    request: Request,
    purchase: PurchaseCreate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    purchase_dict = purchase.model_dump()
    
    if not purchase_dict.get("purchase_date"):
        purchase_dict["purchase_date"] = datetime.now().strftime("%Y-%m-%d")
        
    new_purchase = await request.app.mongodb["purchases"].insert_one(purchase_dict)
    created_purchase = await request.app.mongodb["purchases"].find_one({"_id": new_purchase.inserted_id})
    clean_p = serialize_mongo_doc(created_purchase) or {}

    # Real-Time Broadcast Notification
    try:
        from routers.notifications import broadcast_notification
        p_name = clean_p.get("purchase_name", "Supplies")
        supplier = clean_p.get("supplier_name", "Supplier")
        amt = clean_p.get("amount", 0)
        await broadcast_notification(
            request.app.mongodb,
            title=f"New Purchase: {p_name}",
            message=f"Purchase order for ₹{amt:,.2f} recorded to {supplier}",
            type="purchase",
            link="/purchases"
        )
    except Exception:
        pass

    return clean_p

@router.get("", include_in_schema=False)
@router.get("/", response_description="List all purchase entries")
async def list_purchases(request: Request) -> List[Dict[str, Any]]:
    try:
        purchases = await request.app.mongodb["purchases"].find().sort("_id", -1).to_list(1000)
        return [serialize_mongo_doc(p) for p in purchases if p]
    except Exception:
        try:
            purchases = await request.app.mongodb["purchases"].find().to_list(1000)
            return [serialize_mongo_doc(p) for p in purchases if p]
        except Exception:
            return []

@router.get("/summary", response_description="Get purchase statistics")
async def purchase_summary(request: Request) -> Dict[str, Any]:
    try:
        purchases = await request.app.mongodb["purchases"].find().to_list(1000)
    except Exception:
        purchases = []
    total_amount = sum(p.get("amount", 0) for p in purchases)
    paid_amount = sum(p.get("amount", 0) for p in purchases if p.get("status") == "Paid")
    pending_amount = sum(p.get("amount", 0) for p in purchases if p.get("status") in ["Pending", "Overdue"])
    
    return {
        "totalPurchases": total_amount,
        "paidPurchases": paid_amount,
        "pendingPurchases": pending_amount,
        "count": len(purchases)
    }

@router.get("/{id}", response_description="Get a single purchase entry")
async def show_purchase(id: str, request: Request) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Purchase ID format")
    if (purchase := await request.app.mongodb["purchases"].find_one({"_id": ObjectId(id)})) is not None:
        return serialize_mongo_doc(purchase)
    raise HTTPException(status_code=404, detail=f"Purchase {id} not found")

@router.put("/{id}", response_description="Update a purchase entry")
async def update_purchase(
    id: str,
    request: Request,
    purchase: PurchaseUpdate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Purchase ID format")
        
    purchase_dict = {k: v for k, v in purchase.model_dump().items() if v is not None}

    if len(purchase_dict) >= 1:
        await request.app.mongodb["purchases"].update_one(
            {"_id": ObjectId(id)}, {"$set": purchase_dict}
        )

    if (updated_purchase := await request.app.mongodb["purchases"].find_one({"_id": ObjectId(id)})) is not None:
        return serialize_mongo_doc(updated_purchase)

    raise HTTPException(status_code=404, detail=f"Purchase {id} not found")

@router.delete("/{id}", response_description="Delete a purchase entry")
async def delete_purchase(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Purchase ID format")
        
    delete_result = await request.app.mongodb["purchases"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    raise HTTPException(status_code=404, detail=f"Purchase {id} not found")
