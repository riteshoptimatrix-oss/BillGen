from fastapi import APIRouter, Request, HTTPException, Body
from typing import Dict, Any, List
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/finance", tags=["finance"])

@router.get("/overview", response_description="Get Finance aggregated summary for Sales and Purchases")
async def get_finance_overview(request: Request) -> Dict[str, Any]:
    # 1. Fetch Invoices for Sales
    invoices_cursor = request.app.mongodb["invoices"].find({})
    invoices = await invoices_cursor.to_list(1000)
    
    total_sales = 0.0
    paid_sales = 0.0
    pending_sales = 0.0
    
    for inv in invoices:
        amt = float(inv.get("amount", 0.0))
        total_sales += amt
        status = inv.get("status", "Pending")
        if status == "Paid":
            paid_sales += amt
        else:
            pending_sales += amt

    # 2. Fetch Purchases
    purchases_cursor = request.app.mongodb["purchases"].find({})
    purchases = await purchases_cursor.to_list(1000)
    
    total_purchases = 0.0
    paid_purchases = 0.0
    pending_purchases = 0.0
    
    for p in purchases:
        amt = float(p.get("amount", 0.0))
        total_purchases += amt
        status = p.get("status", "Paid")
        if status == "Paid":
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
    # Invoices directly represent sales records - guarantees no duplicate manual entry
    invoices = await request.app.mongodb["invoices"].find().sort("_id", -1).to_list(1000)
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
async def update_sales_status(id: str, request: Request, payload: Dict[str, str] = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
        
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

