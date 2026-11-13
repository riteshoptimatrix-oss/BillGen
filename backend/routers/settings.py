from fastapi import APIRouter, Request, Body, Depends, HTTPException, status
from typing import Dict, Any, Optional
from security import get_optional_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "key": "global_enterprise_settings",
    "company": {
        "name": "SiddhiVinayak Enterprise",
        "tagline": "High-Performance 3-Wheeler Commercial Vehicles & Spare Parts",
        "phone": "+91 98250 14829",
        "email": "contact@siddhivinayakenterprise.com",
        "website": "www.siddhivinayakenterprise.com",
        "address": "Plot 12, GIDC Heavy Engineering Zone, Odhav, Ahmedabad, Gujarat 382415",
        "state": "Gujarat",
        "stateCode": "24",
        "gstin": "24AAAFO1234F1Z9",
        "pan": "AAAFO1234F",
        "cin": "U34102GJ2015PTC082910",
    },
    "invoice": {
        "prefix": "INV",
        "nextNumber": 1,
        "defaultTerms": "15 Days",
        "defaultPaymentMethod": "Bank Transfer",
        "notes": "1. Goods once sold will not be returned without warranty inspection.\n2. Interest @ 18% p.a. charged after due date.\n3. All disputes subject to Ahmedabad jurisdiction only.",
        "autoDecrementStock": True,
        "showProductImageOnBill": True,
    },
    "tax": {
        "defaultTaxRate": 18,
        "enableGst": True,
        "enableCgstSgstSplit": True,
        "hsnSummaryEnabled": True,
        "reverseChargeApplicable": False,
        "eInvoiceThreshold": 5000000,
    },
    "bank": {
        "bankName": "Bank of Baroda",
        "accountHolder": "SiddhiVinayak Enterprise",
        "accountNumber": "01420200001234",
        "ifscCode": "BARB0ODHAVA",
        "branchName": "Odhav Industrial Estate Branch",
        "accountType": "Current Account",
        "upiId": "siddhivinayak@barodampay",
    }
}

@router.get("/", response_description="Get enterprise system settings")
async def get_settings(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    """Retrieve global settings from MongoDB; seed default record if none exists."""
    db = request.app.mongodb
    settings = await db["settings"].find_one({"key": "global_enterprise_settings"}, {"_id": 0})
    if not settings:
        # Seed initial default settings in MongoDB
        await db["settings"].update_one(
            {"key": "global_enterprise_settings"},
            {"$set": DEFAULT_SETTINGS},
            upsert=True
        )
        return DEFAULT_SETTINGS
    return settings

@router.put("/", response_description="Update enterprise system settings")
async def update_settings(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    """Save or update enterprise settings in MongoDB across all devices."""
    db = request.app.mongodb
    clean_payload = {k: v for k, v in payload.items() if k != "_id"}
    clean_payload["key"] = "global_enterprise_settings"
    
    await db["settings"].update_one(
        {"key": "global_enterprise_settings"},
        {"$set": clean_payload},
        upsert=True
    )
    
    updated = await db["settings"].find_one({"key": "global_enterprise_settings"}, {"_id": 0})
    return {
        "success": True,
        "message": "Enterprise settings synchronized and saved in database.",
        "settings": updated or clean_payload
    }

