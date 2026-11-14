import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Body, Request, HTTPException, status, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
import aiofiles

from datetime import datetime
from models import Labour, LabourCreate, LabourUpdate, SalaryUpdate, serialize_mongo_doc
from security import get_optional_user, validate_uploaded_file

router = APIRouter(prefix="/api/labours", tags=["labours"], dependencies=[Depends(get_optional_user)])

@router.post("/upload", response_description="Upload a labour profile image or KYC document")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Secure file upload with multi-tier validation:
    - Extension whitelist (.jpg, .jpeg, .png, .webp, .pdf)
    - Magic byte header verification
    - 10MB size ceiling
    - UUID sanitization
    """
    content = await file.read()
    validate_uploaded_file(
        filename=file.filename or "labour_doc.jpg",
        content_type=file.content_type or "",
        content=content,
        is_image_only=False
    )
    
    ext = os.path.splitext(file.filename or "labour_doc.jpg")[1].lower()
    if not ext:
        ext = ".jpg"
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    # Save across all potential upload paths so static files resolve reliably
    upload_dirs = [
        os.path.abspath("uploads"),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")),
        os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads"))
    ]
    for d in upload_dirs:
        try:
            os.makedirs(d, exist_ok=True)
            async with aiofiles.open(os.path.join(d, unique_filename), "wb") as out_file:
                await out_file.write(content)
        except Exception:
            pass
        
    base_url = str(request.base_url).rstrip("/")
    return {
        "url": f"{base_url}/uploads/{unique_filename}",
        "path": f"/uploads/{unique_filename}",
        "filename": unique_filename
    }

@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_description="Add new labour", status_code=status.HTTP_201_CREATED)
async def create_labour(
    request: Request,
    labour: LabourCreate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    labour_dict = jsonable_encoder(labour)
    new_labour = await request.app.mongodb["labours"].insert_one(labour_dict)
    created_labour = await request.app.mongodb["labours"].find_one(
        {"_id": new_labour.inserted_id}
    )
    return serialize_mongo_doc(created_labour) or {}

@router.get("", include_in_schema=False)
@router.get("/", response_description="List all labours")
async def list_labours(request: Request) -> List[Dict[str, Any]]:
    try:
        labours = await request.app.mongodb["labours"].find().to_list(1000)
        return [serialize_mongo_doc(l) for l in labours if l]
    except Exception:
        return []

# ==============================================================================
# SALARY & PAYROLL MANAGEMENT MODULE
# NOTE: Defined BEFORE parameterized /{id} wildcard routes so FastAPI doesn't
# incorrectly match "salaries" as an ObjectId path parameter {id}.
# ==============================================================================

@router.get("/salaries", response_description="Get month-wise salary ledger with auto-generated records")
async def get_monthly_salaries(
    request: Request,
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    now = datetime.now()
    cur_month = month if month and 1 <= month <= 12 else now.month
    cur_year = year if year and year > 2000 else now.year
    
    db = request.app.mongodb
    # Include all enrolled staff (fallback to all labours if filter empty)
    try:
        labours = await db["labours"].find({
            "$or": [
                {"status": {"$exists": False}},
                {"status": None},
                {"status": {"$nin": ["Inactive", "inactive", "Terminated", "terminated"]}}
            ]
        }).to_list(1000)
    except Exception:
        labours = []
        
    if not labours:
        try:
            labours = await db["labours"].find().to_list(1000)
        except Exception:
            labours = []
    
    # 1. Fetch existing salary records for the selected month & year
    existing_salaries = await db["salaries"].find({
        "month": {"$in": [cur_month, str(cur_month)]},
        "year": {"$in": [cur_year, str(cur_year)]}
    }).to_list(1000)
    
    existing_by_labour = {str(s["labour_id"]): s for s in existing_salaries}
    
    # 2. Automatically generate salary records for any active labourers who don't have one yet
    for idx, l in enumerate(labours):
        lid = str(l["_id"])
        if lid not in existing_by_labour:
            salary_doc = {
                "labour_id": lid,
                "labour_custom_id": l.get("labour_id") or f"LAB-{str(idx + 1).zfill(3)}",
                "labour_name": l.get("name", "Staff Member"),
                "work_type": l.get("work_type", "Full Time"),
                "month": cur_month,
                "year": cur_year,
                "salary_amount": float(l.get("salary", 0.0)),
                "status": "Pending",
                "payment_date": None,
                "payment_mode": "Bank Transfer (NEFT)",
                "notes": "",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            res = await db["salaries"].insert_one(salary_doc)
            salary_doc["_id"] = res.inserted_id
            existing_salaries.append(salary_doc)
            existing_by_labour[lid] = salary_doc

    # Format salary records list
    records = []
    total_salary = 0.0
    total_paid = 0.0
    total_pending = 0.0
    paid_count = 0
    pending_count = 0
    pending_workers = []

    for s in existing_salaries:
        sid = str(s["_id"])
        amt = float(s.get("salary_amount", 0.0))
        st = s.get("status", "Pending")
        total_salary += amt

        if st == "Paid":
            total_paid += amt
            paid_count += 1
        else:
            total_pending += amt
            pending_count += 1
            pending_workers.append({
                "id": sid,
                "labour_name": s.get("labour_name"),
                "salary_amount": amt
            })

        records.append({
            "id": sid,
            "labour_id": s.get("labour_id"),
            "labour_custom_id": s.get("labour_custom_id"),
            "labour_name": s.get("labour_name"),
            "work_type": s.get("work_type", "Full Time"),
            "month": cur_month,
            "year": cur_year,
            "salary_amount": amt,
            "status": st,
            "payment_date": s.get("payment_date"),
            "payment_mode": s.get("payment_mode", "Bank Transfer (NEFT)"),
            "notes": s.get("notes", "")
        })

    # Sort records: Pending first, then by labour name
    records.sort(key=lambda x: (x["status"] == "Paid", x["labour_name"]))

    # 3. Automatic 10th of Month Reminder Check
    # Triggers when current date is on or after the 10th of the selected month
    reminder_active = False
    reminder_message = ""
    is_current_month = (now.year == cur_year and now.month == cur_month)

    if is_current_month and now.day >= 10 and pending_count > 0:
        reminder_active = True
        reminder_message = (
            f"Monthly Salary Reminder (10th of Month): {pending_count} labourers have "
            f"₹{total_pending:,.0f} in pending salaries for {now.strftime('%B %Y')}."
        )

    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return {
        "period": {
            "month": cur_month,
            "year": cur_year,
            "monthName": f"{month_names[cur_month - 1]} {cur_year}"
        },
        "summary": {
            "totalLabourers": len(records),
            "totalSalary": round(total_salary, 2),
            "totalPaid": round(total_paid, 2),
            "totalPending": round(total_pending, 2),
            "paidCount": paid_count,
            "pendingCount": pending_count
        },
        "reminder": {
            "isActive": reminder_active,
            "message": reminder_message,
            "pendingLabourers": pending_workers
        },
        "records": records
    }

@router.put("/salaries/{salary_id}", response_description="Update labour monthly salary status and amount")
async def update_salary_record(
    salary_id: str,
    request: Request,
    payload: SalaryUpdate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    db = request.app.mongodb
    now = datetime.now()

    target_month = int(payload.month) if payload.month and 1 <= payload.month <= 12 else now.month
    target_year = int(payload.year) if payload.year and payload.year > 2000 else now.year

    existing = None
    # 1. Search directly by _id in salaries collection
    if ObjectId.is_valid(salary_id):
        existing = await db["salaries"].find_one({"_id": ObjectId(salary_id)})

    # 2. If not found, salary_id might be a labourer ID, or payload.labour_id was supplied
    if not existing:
        lid_candidate = payload.labour_id or salary_id

        # Search existing salary by labour_id and (month, year)
        existing = await db["salaries"].find_one({
            "labour_id": lid_candidate,
            "month": {"$in": [target_month, str(target_month)]},
            "year": {"$in": [target_year, str(target_year)]}
        })

        if not existing:
            # Look up labour details in `labours` collection
            labour_query = [{"labour_id": lid_candidate}]
            if ObjectId.is_valid(lid_candidate):
                labour_query.append({"_id": ObjectId(lid_candidate)})
            
            labour = await db["labours"].find_one({"$or": labour_query})
            if labour:
                real_lid = str(labour["_id"])
                # Check again with real ObjectId string
                existing = await db["salaries"].find_one({
                    "labour_id": real_lid,
                    "month": {"$in": [target_month, str(target_month)]},
                    "year": {"$in": [target_year, str(target_year)]}
                })
                if not existing:
                    # Dynamically create monthly salary record for this worker
                    salary_doc = {
                        "labour_id": real_lid,
                        "labour_custom_id": labour.get("labour_id") or f"LAB-{real_lid[-4:].upper()}",
                        "labour_name": labour.get("name", "Staff Member"),
                        "work_type": labour.get("work_type", "Full Time"),
                        "month": target_month,
                        "year": target_year,
                        "salary_amount": float(payload.salary_amount if payload.salary_amount is not None else labour.get("salary", 0.0)),
                        "status": payload.status or "Pending",
                        "payment_date": payload.payment_date,
                        "payment_mode": payload.payment_mode or "Bank Transfer (NEFT)",
                        "notes": payload.notes or "",
                        "created_at": now.isoformat(),
                        "updated_at": now.isoformat()
                    }
                    res = await db["salaries"].insert_one(salary_doc)
                    salary_doc["_id"] = res.inserted_id
                    existing = salary_doc

    if not existing:
        raise HTTPException(status_code=404, detail="Salary record or labourer not found")

    actual_id = existing["_id"]
    update_dict = {
        k: v for k, v in payload.model_dump().items()
        if v is not None and k not in ["labour_id", "month", "year"]
    }
    update_dict["updated_at"] = now.isoformat()

    # Ensure month & year are stored as integers
    if "month" not in existing or not isinstance(existing.get("month"), int):
        update_dict["month"] = target_month
    if "year" not in existing or not isinstance(existing.get("year"), int):
        update_dict["year"] = target_year

    # If marked as Paid and payment_date is not set, auto-record today's date
    if update_dict.get("status") == "Paid":
        if not update_dict.get("payment_date"):
            update_dict["payment_date"] = now.strftime("%Y-%m-%d")
    elif update_dict.get("status") == "Pending":
        update_dict["payment_date"] = None

    # If salary_amount was changed, also update the labour's base salary in labours collection
    if "salary_amount" in update_dict and existing.get("labour_id"):
        try:
            lid = existing["labour_id"]
            if ObjectId.is_valid(lid):
                await db["labours"].update_one(
                    {"_id": ObjectId(lid)},
                    {"$set": {"salary": float(update_dict["salary_amount"])}}
                )
        except Exception:
            pass

    await db["salaries"].update_one(
        {"_id": actual_id},
        {"$set": update_dict}
    )

    updated = await db["salaries"].find_one({"_id": actual_id})

    # Real-Time Broadcast Notification
    try:
        from routers.notifications import broadcast_notification
        w_name = updated.get("labour_name", "Worker")
        st = updated.get("status", "Pending")
        amt = updated.get("salary_amount", 0)
        await broadcast_notification(
            db,
            title=f"Salary {st}: {w_name}",
            message=f"Wage of ₹{amt:,.0f} marked as {st} for {updated.get('month')}/{updated.get('year')}",
            type="payment" if st == "Paid" else "warning",
            link="/labour"
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Salary for {updated.get('labour_name')} updated successfully.",
        "record": {
            "id": str(updated["_id"]),
            "labour_id": updated.get("labour_id"),
            "labour_custom_id": updated.get("labour_custom_id"),
            "labour_name": updated.get("labour_name"),
            "work_type": updated.get("work_type"),
            "month": updated.get("month"),
            "year": updated.get("year"),
            "salary_amount": updated.get("salary_amount"),
            "status": updated.get("status"),
            "payment_date": updated.get("payment_date"),
            "payment_mode": updated.get("payment_mode"),
            "notes": updated.get("notes", "")
        }
    }

@router.get("/salaries/history/{labour_id}", response_description="Get complete salary history for a labourer")
async def get_labour_salary_history(
    labour_id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    db = request.app.mongodb
    history = await db["salaries"].find({
        "labour_id": labour_id
    }).sort([("year", -1), ("month", -1)]).to_list(100)

    month_names = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    formatted = []
    total_earned = 0.0
    total_pending = 0.0

    for h in history:
        amt = float(h.get("salary_amount", 0.0))
        st = h.get("status", "Pending")
        m_idx = int(h.get("month", 1)) - 1
        m_name = month_names[m_idx] if 0 <= m_idx < 12 else str(h.get("month"))

        if st == "Paid":
            total_earned += amt
        else:
            total_pending += amt

        formatted.append({
            "id": str(h["_id"]),
            "month": h.get("month"),
            "year": h.get("year"),
            "periodLabel": f"{m_name} {h.get('year')}",
            "salary_amount": amt,
            "status": st,
            "payment_date": h.get("payment_date"),
            "payment_mode": h.get("payment_mode", "Bank Transfer"),
            "notes": h.get("notes", "")
        })

    return {
        "labour_id": labour_id,
        "totalPaid": round(total_earned, 2),
        "totalPending": round(total_pending, 2),
        "history": formatted
    }

@router.get("/{id}", response_description="Get a single labour")
async def show_labour(id: str, request: Request) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Labour ID format")
    labour = await request.app.mongodb["labours"].find_one({"_id": ObjectId(id)})
    if labour is not None:
        return serialize_mongo_doc(labour)
    raise HTTPException(status_code=404, detail=f"Labour {id} not found")

@router.put("/{id}", response_description="Update a labour")
async def update_labour(
    id: str,
    request: Request,
    labour: LabourUpdate = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Labour ID format")
    
    labour_dict = {k: v for k, v in labour.model_dump().items() if v is not None}
    
    if len(labour_dict) >= 1:
        await request.app.mongodb["labours"].update_one(
            {"_id": ObjectId(id)}, {"$set": labour_dict}
        )
                
    existing_labour = await request.app.mongodb["labours"].find_one({"_id": ObjectId(id)})
    if existing_labour is not None:
        return serialize_mongo_doc(existing_labour)
    raise HTTPException(status_code=404, detail=f"Labour {id} not found")

@router.delete("/{id}", response_description="Delete a labour")
async def delete_labour(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Labour ID format")
    
    delete_result = await request.app.mongodb["labours"].delete_one({"_id": ObjectId(id)})
    
    if delete_result.deleted_count == 1:
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
    
    raise HTTPException(status_code=404, detail=f"Labour {id} not found")

