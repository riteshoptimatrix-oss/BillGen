import os
import re
import aiofiles
from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from models import Invoice, InvoiceCreate, InvoiceUpdate
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

    # Strictly sanitize invoice identifier to prevent directory traversal
    clean_num = re.sub(r"[^A-Za-z0-9_-]", "_", invoice_number) if invoice_number else f"inv_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    filename = f"Invoice_{clean_num}.pdf"
    file_path = os.path.join(backend_invoices_dir, filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Also sync to root uploads if accessible
    try:
        root_path = os.path.join(root_invoices_dir, filename)
        async with aiofiles.open(root_path, "wb") as rf:
            await rf.write(content)
    except Exception:
        pass

    base_url = str(request.base_url).rstrip("/")
    pdf_url = f"{base_url}/uploads/invoices/{filename}"

    if invoice_id and ObjectId.is_valid(invoice_id):
        await request.app.mongodb["invoices"].update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": {"pdf_url": pdf_url}}
        )

    return {"url": pdf_url, "filename": filename, "status": "success"}

async def get_next_invoice_number_internal(mongodb) -> str:
    current_year = datetime.now().year
    count = await mongodb["invoices"].count_documents({})
    cursor = mongodb["invoices"].find({"invoice_number": {"$regex": f"^INV-{current_year}-"}}).sort("invoice_number", -1).limit(1)
    latest = await cursor.to_list(1)
    if latest and "invoice_number" in latest[0]:
        try:
            parts = latest[0]["invoice_number"].split("-")
            seq = int(parts[-1]) + 1
            return f"INV-{current_year}-{seq:04d}"
        except Exception:
            pass
    return f"INV-{current_year}-{(count + 1):04d}"

@router.get("/next-number", response_description="Get next available invoice number")
async def get_next_invoice_number(request: Request) -> Dict[str, str]:
    next_number = await get_next_invoice_number_internal(request.app.mongodb)
    return {"next_number": next_number}

@router.post("/", response_description="Create a new invoice", status_code=status.HTTP_201_CREATED, response_model=Invoice)
async def create_invoice(
    request: Request,
    invoice: InvoiceCreate = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    invoice_dict = invoice.model_dump()
    
    # Auto-generate invoice number if missing
    if not invoice_dict.get("invoice_number"):
        invoice_dict["invoice_number"] = await get_next_invoice_number_internal(request.app.mongodb)
        
    # Default date to today if missing
    if not invoice_dict.get("date"):
        invoice_dict["date"] = datetime.now().strftime("%Y-%m-%d")

    new_invoice = await request.app.mongodb["invoices"].insert_one(invoice_dict)
    created_invoice = await request.app.mongodb["invoices"].find_one({"_id": new_invoice.inserted_id})

    # Automatically update stock quantities for finalized invoice items
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
                elif item.get("description"):
                    await request.app.mongodb["products"].update_one(
                        {"name": item.get("description")},
                        {"$inc": {"stock": -qty}}
                    )

    return created_invoice

@router.get("/", response_description="List all invoices", response_model=List[Invoice])
async def list_invoices(request: Request):
    invoices = await request.app.mongodb["invoices"].find().sort("_id", -1).to_list(1000)
    
    current_year = datetime.now().year
    for idx, inv in enumerate(invoices):
        if not inv.get("invoice_number"):
            hex_suffix = str(inv["_id"])[-4:].upper()
            inv["invoice_number"] = f"INV-{current_year}-{hex_suffix}"
            
    return invoices

@router.get("/{id}", response_description="Get a single invoice", response_model=Invoice)
async def show_invoice(id: str, request: Request):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
    if (invoice := await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)})) is not None:
        if not invoice.get("invoice_number"):
            invoice["invoice_number"] = f"INV-{datetime.now().year}-{str(invoice['_id'])[-4:].upper()}"
        return invoice
    raise HTTPException(status_code=404, detail=f"Invoice {id} not found")

@router.put("/{id}", response_description="Update an invoice", response_model=Invoice)
async def update_invoice(
    id: str,
    request: Request,
    invoice: InvoiceUpdate = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    invoice_dict = {k: v for k, v in invoice.model_dump().items() if v is not None}

    if len(invoice_dict) >= 1:
        await request.app.mongodb["invoices"].update_one(
            {"_id": ObjectId(id)}, {"$set": invoice_dict}
        )

    if (updated_invoice := await request.app.mongodb["invoices"].find_one({"_id": ObjectId(id)})) is not None:
        return updated_invoice

    raise HTTPException(status_code=404, detail=f"Invoice {id} not found")

@router.delete("/{id}", response_description="Delete an invoice")
async def delete_invoice(
    id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    delete_result = await request.app.mongodb["invoices"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

    raise HTTPException(status_code=404, detail=f"Invoice {id} not found")
