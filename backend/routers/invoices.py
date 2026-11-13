import os
import re
import secrets
import base64
import aiofiles
from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
import uuid
from typing import List, Dict, Any, Optional
from models import Invoice, InvoiceCreate, InvoiceUpdate, PaymentTransactionCreate, serialize_mongo_doc
from bson import ObjectId
from datetime import datetime

from security import get_current_user, get_optional_user, validate_uploaded_file

router = APIRouter(prefix="/api/invoices", tags=["invoices"])

@router.post("/upload-pdf", response_description="Upload generated Invoice PDF for direct online sharing")
async def upload_invoice_pdf(
    request: Request,
    file: UploadFile = File(...),
    invoice_number: str = Form(""),
    invoice_id: str = Form(""),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Secure Invoice PDF upload:
    - Multi-tier PDF validation (%PDF- magic byte check)
    - Path traversal prevention on invoice number
    - Multi-destination sync to static serving directory
    """
    content = await file.read()
    validate_uploaded_file(
        filename=file.filename or "invoice.pdf",
        content_type=file.content_type or "application/pdf",
        content=content,
        is_pdf_only=True
    )

    # Ensure destination directories exist
    backend_invoices_dir = os.path.abspath("uploads/invoices")
    os.makedirs(backend_invoices_dir, exist_ok=True)
    root_invoices_dir = os.path.abspath(os.path.join("..", "uploads", "invoices"))
    try:
        os.makedirs(root_invoices_dir, exist_ok=True)
    except Exception:
        pass

    # Strictly sanitize invoice identifier
    clean_num = re.sub(r"[^A-Za-z0-9_-]", "_", invoice_number) if invoice_number else f"inv_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    unique_suffix = f"_{str(invoice_id)[-8:]}" if (invoice_id and ObjectId.is_valid(invoice_id)) else f"_{secrets.token_hex(4)}"
    
    canonical_filename = f"Invoice_{clean_num}.pdf"
    suffixed_filename = f"Invoice_{clean_num}{unique_suffix}.pdf"

    # Save canonical exact file (e.g. Invoice_INV-2026-0002.pdf)
    canonical_path = os.path.join(backend_invoices_dir, canonical_filename)
    async with aiofiles.open(canonical_path, "wb") as f:
        await f.write(content)

    # Save suffixed hash file (e.g. Invoice_INV-2026-0002_68d5e12a.pdf)
    suffixed_path = os.path.join(backend_invoices_dir, suffixed_filename)
    async with aiofiles.open(suffixed_path, "wb") as f:
        await f.write(content)

    # Also sync both to root uploads if accessible
    try:
        async with aiofiles.open(os.path.join(root_invoices_dir, canonical_filename), "wb") as rf:
            await rf.write(content)
        async with aiofiles.open(os.path.join(root_invoices_dir, suffixed_filename), "wb") as rf:
            await rf.write(content)
    except Exception:
        pass

    base_url = str(request.base_url).rstrip("/")
    pdf_url = f"{base_url}/uploads/invoices/{canonical_filename}"
    suffixed_url = f"{base_url}/uploads/invoices/{suffixed_filename}"

    # Permanent persistence in MongoDB Atlas (guarantees PDFs survive Render ephemeral disk restarts)
    pdf_b64 = base64.b64encode(content).decode("ascii")
    update_fields = {"pdf_url": pdf_url, "pdf_suffixed_url": suffixed_url, "pdf_base64": pdf_b64}

    if invoice_id and ObjectId.is_valid(invoice_id):
        await request.app.mongodb["invoices"].update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": update_fields}
        )
    elif invoice_number:
        await request.app.mongodb["invoices"].update_one(
            {"invoice_number": invoice_number},
            {"$set": update_fields}
        )

    return {
        "url": pdf_url,
        "filename": canonical_filename,
        "suffixed_url": suffixed_url,
        "status": "success"
    }

async def get_next_invoice_number_internal(mongodb) -> str:
    current_year = datetime.now().year
    cursor = mongodb["invoices"].find(
        {"invoice_number": {"$regex": f"^INV-{current_year}-"}},
        {"invoice_number": 1}
    ).sort("invoice_number", -1).limit(1)
    latest = await cursor.to_list(1)
    if latest and "invoice_number" in latest[0]:
        try:
            parts = latest[0]["invoice_number"].split("-")
            seq = int(parts[-1]) + 1
            return f"INV-{current_year}-{seq:04d}"
        except Exception:
            pass
    count = await mongodb["invoices"].count_documents({})
    return f"INV-{current_year}-{(count + 1):04d}"

@router.get("/next-number", response_description="Get next available invoice number")
async def get_next_invoice_number(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, str]:
    next_number = await get_next_invoice_number_internal(request.app.mongodb)
    return {"next_number": next_number}

@router.post("/", response_description="Create or update an invoice", status_code=status.HTTP_201_CREATED, response_model=Invoice)
async def create_invoice(
    request: Request,
    invoice: InvoiceCreate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    invoice_dict = invoice.model_dump()
    
    # Auto-generate invoice number if missing
    if not invoice_dict.get("invoice_number"):
        invoice_dict["invoice_number"] = await get_next_invoice_number_internal(request.app.mongodb)
        
    # Default date to today if missing
    if not invoice_dict.get("date"):
        invoice_dict["date"] = datetime.now().strftime("%Y-%m-%d")

    # PREVENT DUPLICATES: If an invoice with this invoice_number already exists, update it cleanly
    existing = await request.app.mongodb["invoices"].find_one({"invoice_number": invoice_dict["invoice_number"]})
    if existing:
        await request.app.mongodb["invoices"].update_one(
            {"_id": existing["_id"]},
            {"$set": invoice_dict}
        )
        created_invoice = await request.app.mongodb["invoices"].find_one(
            {"_id": existing["_id"]},
            {"pdf_base64": 0}
        )
    else:
        new_invoice = await request.app.mongodb["invoices"].insert_one(invoice_dict)
        created_invoice = await request.app.mongodb["invoices"].find_one(
            {"_id": new_invoice.inserted_id},
            {"pdf_base64": 0}
        )

        # Automatically update stock quantities for finalized invoice items on new creation
        if invoice_dict.get("items"):
            for item in invoice_dict["items"]:
                qty = int(float(item.get("quantity", 0)))
                if qty > 0:
                    prod_id = item.get("product_id")
                    if prod_id and ObjectId.is_valid(prod_id):
                        await request.app.mongodb["products"].update_one(
                            {"_id": ObjectId(prod_id)},
                            {"$inc": {"stock": -qty}}
                        )
                        # Check low stock threshold
                        updated_prod = await request.app.mongodb["products"].find_one({"_id": ObjectId(prod_id)})
                        if updated_prod and updated_prod.get("stock", 0) < 10:
                            try:
                                from routers.notifications import broadcast_notification
                                await broadcast_notification(
                                    request.app.mongodb,
                                    title=f"Low Stock Alert: {updated_prod.get('name')}",
                                    message=f"Only {updated_prod.get('stock')} units left in stock! Restock advised.",
                                    type="stock",
                                    link="/products"
                                )
                            except Exception:
                                pass
                    elif item.get("description"):
                        await request.app.mongodb["products"].update_one(
                            {"name": item.get("description")},
                            {"$inc": {"stock": -qty}}
                        )

    # Real-Time Broadcast Notification for newly created/updated invoice
    try:
        from routers.notifications import broadcast_notification
        inv_num = created_invoice.get("invoice_number", "INV")
        client_name = created_invoice.get("client", "Customer")
        amt = created_invoice.get("amount", 0)
        await broadcast_notification(
            request.app.mongodb,
            title=f"Sales Bill Synced: {inv_num}",
            message=f"Invoice for ₹{amt:,.2f} recorded for {client_name}",
            type="invoice",
            link="/finance"
        )
    except Exception:
        pass

    return serialize_mongo_doc(created_invoice) or {}

@router.get("", include_in_schema=False)
@router.get("/", response_description="List all invoices", response_model=List[Dict[str, Any]])
async def list_invoices(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> List[Dict[str, Any]]:
    # CRITICAL PERFORMANCE BOOST: Exclude heavy pdf_base64 payload from list queries
    try:
        invoices = await request.app.mongodb["invoices"].find({}, {"pdf_base64": 0}).sort([("date", -1), ("_id", -1)]).to_list(1000)
    except Exception:
        try:
            invoices = await request.app.mongodb["invoices"].find({}, {"pdf_base64": 0}).to_list(1000)
        except Exception:
            return []
    
    current_year = datetime.now().year
    clean_invoices = []
    for inv in invoices:
        inv = serialize_mongo_doc(inv)
        if not inv:
            continue
        inv_id = str(inv.get("_id", ""))
        inv["id"] = inv_id
        inv["_id"] = inv_id
        if not inv.get("invoice_number"):
            hex_suffix = inv_id[-4:].upper() if len(inv_id) >= 4 else "0001"
            inv["invoice_number"] = f"INV-{current_year}-{hex_suffix}"
            
        tot = float(inv.get("amount", 0.0) or 0.0)
        paid = float(inv.get("amount_paid", 0.0) or 0.0)
        # If amount_paid is 0 but status was marked Paid, infer full payment
        if paid == 0.0 and inv.get("status") == "Paid" and tot > 0:
            paid = tot
            inv["amount_paid"] = paid

        bal = max(0.0, round(tot - paid, 2))
        pct = round((paid / tot * 100), 1) if tot > 0 else (100.0 if paid > 0 else 0.0)
        inv["balance_due"] = bal
        inv["paid_percentage"] = pct

        # Dynamic Status Assignment
        if bal <= 0 and paid > 0:
            inv["status"] = "Paid"
        elif paid > 0 and bal > 0:
            inv["status"] = "Partially Paid"

        clean_invoices.append(inv)

    return clean_invoices

@router.get("/{id}", response_description="Get a single invoice", response_model=Dict[str, Any])
async def show_invoice(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
    if (invoice := await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})) is not None:
        inv = serialize_mongo_doc(invoice)
        inv_id = str(inv.get("_id", id))
        inv["id"] = inv_id
        inv["_id"] = inv_id
        if not inv.get("invoice_number"):
            inv["invoice_number"] = f"INV-{datetime.now().year}-{inv_id[-4:].upper()}"
        
        tot = float(inv.get("amount", 0.0) or 0.0)
        paid = float(inv.get("amount_paid", 0.0) or 0.0)
        if paid == 0.0 and inv.get("status") == "Paid" and tot > 0:
            paid = tot
            inv["amount_paid"] = paid

        bal = max(0.0, round(tot - paid, 2))
        pct = round((paid / tot * 100), 1) if tot > 0 else (100.0 if paid > 0 else 0.0)
        inv["balance_due"] = bal
        inv["paid_percentage"] = pct

        if bal <= 0 and paid > 0:
            inv["status"] = "Paid"
        elif paid > 0 and bal > 0:
            inv["status"] = "Partially Paid"

        return inv
    raise HTTPException(status_code=404, detail=f"Invoice {id} not found")

@router.put("/{id}", response_description="Update an invoice", response_model=Dict[str, Any])
async def update_invoice(
    id: str,
    request: Request,
    invoice: InvoiceUpdate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    invoice_dict = {k: v for k, v in invoice.model_dump().items() if v is not None}

    if len(invoice_dict) >= 1:
        await request.app.mongodb["invoices"].update_one(
            {"_id": ObjectId(id)}, {"$set": invoice_dict}
        )

    if (updated_invoice := await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})) is not None:
        clean_inv = serialize_mongo_doc(updated_invoice)
        if "status" in invoice_dict:
            try:
                from routers.notifications import broadcast_notification
                st = clean_inv.get("status", "Updated")
                inv_num = clean_inv.get("invoice_number", f"INV-{id[-4:].upper()}")
                client_name = clean_inv.get("client", "Customer")
                await broadcast_notification(
                    request.app.mongodb,
                    title=f"Invoice Status: {inv_num}",
                    message=f"Invoice for {client_name} marked as {st}",
                    type="payment" if st == "Paid" else "invoice",
                    link="/finance"
                )
            except Exception:
                pass
        return clean_inv

    raise HTTPException(status_code=404, detail=f"Invoice {id} not found")

@router.delete("/{id}", response_description="Delete an invoice")
async def delete_invoice(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    # Restore stock for deleted invoice items
    invoice = await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)})
    if invoice and invoice.get("items"):
        for item in invoice["items"]:
            qty = int(float(item.get("quantity", 0)))
            if qty > 0:
                prod_id = item.get("product_id")
                if prod_id and ObjectId.is_valid(prod_id):
                    await request.app.mongodb["products"].update_one(
                        {"_id": ObjectId(prod_id)},
                        {"$inc": {"stock": qty}}
                    )
                elif item.get("description"):
                    await request.app.mongodb["products"].update_one(
                        {"name": item.get("description")},
                        {"$inc": {"stock": qty}}
                    )

    delete_result = await request.app.mongodb["invoices"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    raise HTTPException(status_code=404, detail=f"Invoice {id} not found")

# ==============================================================================
# MANUAL PARTIAL PAYMENT MANAGEMENT
# ==============================================================================

@router.post("/{id}/payments", response_description="Record a manual partial or full payment against an invoice")
async def record_invoice_payment(
    id: str,
    request: Request,
    payment: PaymentTransactionCreate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
    
    db = request.app.mongodb
    invoice = await db["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    invoice_total = float(invoice.get("amount", 0.0))
    current_paid = float(invoice.get("amount_paid", 0.0))
    remaining_balance = max(0.0, round(invoice_total - current_paid, 2))

    payment_amt = round(float(payment.amount), 2)
    if payment_amt <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")

    if payment_amt > remaining_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount ₹{payment_amt:,.2f} exceeds remaining balance ₹{remaining_balance:,.2f}."
        )

    now = datetime.now()
    pay_doc = {
        "id": f"PAY-{uuid.uuid4().hex[:8].upper()}",
        "amount": payment_amt,
        "date": payment.date or now.strftime("%Y-%m-%d"),
        "mode": payment.mode or "Bank Transfer",
        "reference_note": payment.reference_note or "",
        "created_at": now.isoformat()
    }

    new_paid = round(current_paid + payment_amt, 2)
    new_balance = max(0.0, round(invoice_total - new_paid, 2))
    new_pct = round((new_paid / invoice_total * 100), 1) if invoice_total > 0 else 100.0

    if new_balance <= 0 or new_pct >= 100.0:
        new_status = "Paid"
    elif new_paid > 0:
        new_status = "Partially Paid"
    else:
        new_status = "Pending"

    await db["invoices"].update_one(
        {"_id": ObjectId(id)},
        {
            "$push": {"payments": pay_doc},
            "$set": {
                "amount_paid": new_paid,
                "balance_due": new_balance,
                "paid_percentage": new_pct,
                "status": new_status,
                "updated_at": now.isoformat()
            }
        }
    )

    updated_invoice = await db["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})
    clean_inv = serialize_mongo_doc(updated_invoice) or {}
    clean_inv["paid_percentage"] = new_pct

    # Real-Time Broadcast Notification
    try:
        from routers.notifications import broadcast_notification
        inv_num = clean_inv.get("invoice_number", f"INV-{id[-4:].upper()}")
        client_name = clean_inv.get("client", "Customer")
        await broadcast_notification(
            db,
            title=f"Payment Received: {inv_num}",
            message=f"Received ₹{payment_amt:,.2f} ({new_pct}% Paid) from {client_name}",
            type="payment",
            link="/bill-invoice"
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Payment of ₹{payment_amt:,.2f} recorded successfully ({new_pct}% completed).",
        "invoice": clean_inv
    }

@router.delete("/{id}/payments/{payment_id}", response_description="Delete/revert a recorded payment")
async def delete_invoice_payment(
    id: str,
    payment_id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
    
    db = request.app.mongodb
    invoice = await db["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    existing_payments = invoice.get("payments", [])
    filtered_payments = [p for p in existing_payments if p.get("id") != payment_id]

    if len(filtered_payments) == len(existing_payments):
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    invoice_total = float(invoice.get("amount", 0.0))
    new_paid = round(sum(float(p.get("amount", 0.0)) for p in filtered_payments), 2)
    new_balance = max(0.0, round(invoice_total - new_paid, 2))
    new_pct = round((new_paid / invoice_total * 100), 1) if invoice_total > 0 else 0.0

    if new_balance <= 0 and new_paid > 0:
        new_status = "Paid"
    elif new_paid > 0:
        new_status = "Partially Paid"
    else:
        new_status = "Pending"

    now = datetime.now()
    await db["invoices"].update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "payments": filtered_payments,
                "amount_paid": new_paid,
                "balance_due": new_balance,
                "paid_percentage": new_pct,
                "status": new_status,
                "updated_at": now.isoformat()
            }
        }
    )

    updated_invoice = await db["invoices"].find_one({"_id": ObjectId(id)}, {"pdf_base64": 0})
    clean_inv = serialize_mongo_doc(updated_invoice) or {}
    clean_inv["paid_percentage"] = new_pct

    return {
        "success": True,
        "message": "Payment transaction reverted successfully.",
        "invoice": clean_inv
    }

