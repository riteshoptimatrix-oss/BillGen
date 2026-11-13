import asyncio
from fastapi import APIRouter, Request, HTTPException, Body, Depends, status
from typing import Dict, Any, List, Optional
from bson import ObjectId
from datetime import datetime
from security import get_optional_user

router = APIRouter(prefix="/api/finance", tags=["finance"])

@router.get("/overview", response_description="Get Finance aggregated summary for Sales and Purchases")
async def get_finance_overview(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    db = request.app.mongodb
    
    # Run invoices and purchases concurrently with lean projections
    invoices, purchases = await asyncio.gather(
        db["invoices"].find({}, {"amount": 1, "status": 1, "date": 1}).to_list(2000),
        db["purchases"].find({}, {"amount": 1, "status": 1, "purchase_date": 1, "date": 1}).to_list(2000)
    )
    
    total_sales = 0.0
    paid_sales = 0.0
    pending_sales = 0.0
    today_sales = 0.0
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    for inv in invoices:
        amt = float(inv.get("amount", 0.0))
        total_sales += amt
        status_val = inv.get("status", "Pending")
        inv_date = str(inv.get("date", ""))[:10]
        if inv_date == today_str:
            today_sales += amt
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
        "totalSales": round(total_sales, 2),
        "todaySales": round(today_sales, 2),
        "paidSales": round(paid_sales, 2),
        "pendingSales": round(pending_sales, 2),
        "salesCount": len(invoices),
        "totalPurchases": round(total_purchases, 2),
        "paidPurchases": round(paid_purchases, 2),
        "pendingPurchases": round(pending_purchases, 2),
        "purchasesCount": len(purchases),
        "netBalance": round(net_balance, 2),
    }

@router.get("/sales", response_description="Get all Sales records derived directly from Invoices")
async def get_sales_records(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> List[Dict[str, Any]]:
    # Exclude heavy pdf_base64 payload
    invoices = await request.app.mongodb["invoices"].find({}, {"pdf_base64": 0}).sort("date", -1).sort("_id", -1).to_list(2000)
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
            "customer_phone": inv.get("customer_phone", ""),
            "customer_gst": inv.get("customer_gst", ""),
            "date": inv.get("date", ""),
            "due_date": inv.get("due_date", ""),
            "amount": float(inv.get("amount", 0.0)),
            "amount_paid": float(inv.get("amount_paid", 0.0)),
            "balance_due": float(inv.get("balance_due", 0.0)),
            "subtotal": float(inv.get("subtotal", 0.0)),
            "discount_amount": float(inv.get("discount_amount", 0.0)),
            "taxable_amount": float(inv.get("taxable_amount", 0.0)),
            "tax_percent": float(inv.get("tax_percent", 0.0)),
            "cgst_amount": float(inv.get("cgst_amount", 0.0)),
            "sgst_amount": float(inv.get("sgst_amount", 0.0)),
            "igst_amount": float(inv.get("igst_amount", 0.0)),
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
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
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
        
    inv = await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice record not found")
        
    total_amt = float(inv.get("amount", 0.0))
    update_data = {
        "status": new_status,
        "amount_paid": total_amt if new_status == "Paid" else 0.0,
        "balance_due": 0.0 if new_status == "Paid" else total_amt
    }
    await request.app.mongodb["invoices"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
        
    updated = await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})
    
    # Real-Time Broadcast Notification
    try:
        from routers.notifications import broadcast_notification
        inv_num = updated.get("invoice_number", f"INV-{id[-4:].upper()}")
        client_name = updated.get("client", "Customer")
        await broadcast_notification(
            request.app.mongodb,
            title=f"Payment Status: {inv_num}",
            message=f"Invoice for {client_name} marked as {new_status}",
            type="payment" if new_status == "Paid" else "invoice",
            link="/finance"
        )
    except Exception:
        pass

    return {
        "id": str(updated["_id"]),
        "status": updated.get("status"),
        "message": "Payment status updated successfully"
    }
