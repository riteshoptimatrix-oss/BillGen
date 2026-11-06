import asyncio
from fastapi import APIRouter, Request, HTTPException, Body, Depends, status
from typing import Dict, Any, List
from bson import ObjectId
from datetime import datetime
from security import get_current_user

router = APIRouter(prefix="/api/finance", tags=["finance"], dependencies=[Depends(get_current_user)])

@router.get("/overview", response_description="Get Finance aggregated summary for Sales and Purchases")
async def get_finance_overview(request: Request) -> Dict[str, Any]:
    db = request.app.mongodb
    
    # Run invoices and purchases concurrently with lean projections
    invoices, purchases = await asyncio.gather(
        db["invoices"].find({}, {"amount": 1, "status": 1}).to_list(1000),
        db["purchases"].find({}, {"amount": 1, "status": 1}).to_list(1000)
    )
    
    total_sales = 0.0
    paid_sales = 0.0
    pending_sales = 0.0
    
    for inv in invoices:
        amt = float(inv.get("amount", 0.0))
        total_sales += amt
        status_val = inv.get("status", "Pending")
        if status_val == "Paid":
            paid_sales += amt
        else:
            pending_sales += amt

    total_purchases = 0.0
    paid_purchases = 0.0
    pending_purchases = 0.0
    
    for p in purchases:
        amt = float(p.get("amount", 0.0))
        total_purchases += amt
        status_val = p.get("status", "Paid")
        if status_val == "Paid":
            paid_purchases += amt
        else:
            pending_purchases += amt

    net_balance = total_sales - total_purchases

    return {
        "totalSales": total_sales,
        "paidSales": paid_sales,
        "pendingSales": pending_sales,
        "salesCount": len(invoices),
        "totalPurchases": total_purchases,
        "paidPurchases": paid_purchases,
        "pendingPurchases": pending_purchases,
        "purchasesCount": len(purchases),
        "netBalance": net_balance,
    }

@router.get("/sales", response_description="Get all Sales records derived directly from Invoices")
async def get_sales_records(request: Request) -> List[Dict[str, Any]]:
    # Exclude heavy pdf_base64 payload
    invoices = await request.app.mongodb["invoices"].find({}, {"pdf_base64": 0}).sort("_id", -1).to_list(1000)
    current_year = datetime.now().year
    
    sales_records = []
    for inv in invoices:
        inv_id = str(inv["_id"])
        inv_number = inv.get("invoice_number")
        if not inv_number:
            inv_number = f"INV-{current_year}-{inv_id[-4:].upper()}"
            
        sales_records.append({
            "id": inv_id,
            "invoice_number": inv_number,
            "customer_name": inv.get("client", "Unknown Customer"),
            "date": inv.get("date", ""),
            "due_date": inv.get("due_date", ""),
            "amount": float(inv.get("amount", 0.0)),
            "status": inv.get("status", "Pending"),
            "items": inv.get("items", []),
            "notes": inv.get("notes", "")
        })
        
    return sales_records

@router.patch("/sales/{id}/status", response_description="Update sales/invoice payment status")
async def update_sales_status(
    id: str,
    request: Request,
    payload: Dict[str, str] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    new_status = payload.get("status")
    allowed_statuses = {"Paid", "Pending", "Overdue", "Cancelled"}
    if not new_status or new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status value. Must be one of: {', '.join(allowed_statuses)}"
        )
        
    update_result = await request.app.mongodb["invoices"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": new_status}}
    )
    
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice record not found")
        
    updated = await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)})
    return {
        "id": str(updated["_id"]),
        "status": updated.get("status"),
        "message": "Payment status updated successfully"
    }
