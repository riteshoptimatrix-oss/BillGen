import re
from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator
from typing import Optional, Annotated, List, Dict, Any
from pydantic.functional_validators import BeforeValidator

# Helper for MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

def serialize_mongo_doc(doc: Any) -> Any:
    """
    Recursively converts MongoDB/BSON types (ObjectId, datetime, Decimal128)
    into standard JSON-serializable Python data structures.
    Guarantees both _id and id are accessible as strings.
    """
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if k == "_id":
                res["_id"] = str(v)
                res["id"] = str(v)
            elif hasattr(v, "__str__") and type(v).__name__ in ["ObjectId", "Decimal128"]:
                res[k] = str(v)
            elif hasattr(v, "isoformat"):
                res[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                res[k] = serialize_mongo_doc(v)
            else:
                res[k] = v
        if "_id" in res and "id" not in res:
            res["id"] = res["_id"]
        return res
    if hasattr(doc, "__str__") and type(doc).__name__ in ["ObjectId", "Decimal128"]:
        return str(doc)
    if hasattr(doc, "isoformat"):
        return doc.isoformat()
    return doc

# Indian Statutory Regulatory RegEx Patterns
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
MOBILE_REGEX = re.compile(r"^(?:\+91|0)?[6-9]\d{9}$")
IFSC_REGEX = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")

def validate_gstin_format(val: Optional[str]) -> Optional[str]:
    """Validate and normalize Indian Goods & Services Tax (GSTIN)."""
    if not val or not str(val).strip():
        return None
    return str(val).strip().upper()

def validate_mobile_format(val: Optional[str]) -> str:
    """Validate and normalize Indian Mobile phone numbers."""
    if not val or not str(val).strip():
        return ""
    cleaned = re.sub(r"[\s\-\(\)]", "", str(val).strip())
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
    return cleaned

def validate_ifsc_format(val: Optional[str]) -> Optional[str]:
    """Validate and normalize Indian Financial System Code (IFSC)."""
    if not val or not str(val).strip():
        return None
    return str(val).strip().upper()

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    gallery: Optional[List[str]] = None
    price: float = 0.0
    cost_price: Optional[float] = 0.0
    stock: int = 0
    min_stock_alert: Optional[int] = 5
    category: Optional[str] = "Chassis & Frame"
    unit: Optional[str] = "Piece (Pcs)"
    hsn_code: Optional[str] = "HSN8708"
    tax_rate: Optional[float] = 18.0
    status: Optional[str] = "Active"
    specifications: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    gallery: Optional[List[str]] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock: Optional[int] = None
    min_stock_alert: Optional[int] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    hsn_code: Optional[str] = None
    tax_rate: Optional[float] = None
    status: Optional[str] = None
    specifications: Optional[str] = None

class Product(ProductBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class LabourBase(BaseModel):
    name: str
    mobile_number: str
    address: Optional[str] = None
    image: Optional[str] = None
    aadhar_image: Optional[str] = None
    salary: float = 0.0
    labour_id: Optional[str] = None
    status: Optional[str] = "Active"
    work_type: Optional[str] = "Full Time"
    joining_date: Optional[str] = None

    @field_validator("mobile_number")
    @classmethod
    def check_mobile(cls, v: str) -> str:
        return validate_mobile_format(v)

class LabourCreate(LabourBase):
    pass

class LabourUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    aadhar_image: Optional[str] = None
    salary: Optional[float] = None
    labour_id: Optional[str] = None
    status: Optional[str] = None
    work_type: Optional[str] = None
    joining_date: Optional[str] = None

class Labour(LabourBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class PaymentTransactionCreate(BaseModel):
    amount: float
    date: Optional[str] = None
    mode: Optional[str] = "Bank Transfer"
    reference_note: Optional[str] = None

class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    total: float = 0.0

class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    client: str # Customer Name
    customer_phone: Optional[str] = None
    customer_gst: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    
    date: str # Invoice Date (YYYY-MM-DD)
    payment_terms: Optional[str] = "15 Days"
    payment_terms_days: Optional[int] = 15
    due_date: Optional[str] = None
    payment_method: Optional[str] = "Bank Transfer" # Cash, UPI, Bank Transfer
    place_of_supply: Optional[str] = "Intra-State (Within Gujarat - CGST+SGST)"
    
    items: Optional[List[Dict[str, Any]]] = None
    subtotal: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    tax_percent: Optional[float] = 18.0
    taxable_amount: Optional[float] = 0.0
    cgst_amount: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_amount: Optional[float] = 0.0
    amount: float # Grand Total
    amount_paid: Optional[float] = 0.0
    balance_due: Optional[float] = 0.0
    paid_percentage: Optional[float] = 0.0
    payments: Optional[List[Dict[str, Any]]] = None
    status: str = "Pending" # "Paid", "Pending", "Partially Paid", "Overdue"
    
    # Customer Bank Details
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = None
    
    notes: Optional[str] = None

    @field_validator("customer_phone")
    @classmethod
    def check_customer_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        cleaned = re.sub(r"[\s\-\(\)]", "", str(v).strip())
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

    @field_validator("customer_gst")
    @classmethod
    def check_customer_gst(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip().upper()

    @field_validator("ifsc_code")
    @classmethod
    def check_invoice_ifsc(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip().upper()

    @model_validator(mode="before")
    @classmethod
    def populate_aliases_and_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("client") and data.get("customer_name"):
                data["client"] = data["customer_name"]
            if not data.get("date") and data.get("invoice_date"):
                data["date"] = data["invoice_date"]
            if "amount" not in data or data.get("amount") is None:
                if "grand_total" in data:
                    data["amount"] = data["grand_total"]
                elif "subtotal" in data:
                    data["amount"] = data["subtotal"]
                else:
                    data["amount"] = 0.0
        return data

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    client: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_gst: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    date: Optional[str] = None
    payment_terms: Optional[str] = None
    payment_terms_days: Optional[int] = None
    due_date: Optional[str] = None
    payment_method: Optional[str] = None
    place_of_supply: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    subtotal: Optional[float] = None
    discount_amount: Optional[float] = None
    tax_percent: Optional[float] = None
    taxable_amount: Optional[float] = None
    cgst_amount: Optional[float] = None
    sgst_amount: Optional[float] = None
    igst_amount: Optional[float] = None
    amount: Optional[float] = None
    amount_paid: Optional[float] = None
    balance_due: Optional[float] = None
    paid_percentage: Optional[float] = None
    payments: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("customer_phone")
    @classmethod
    def check_customer_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        cleaned = re.sub(r"[\s\-\(\)]", "", str(v).strip())
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

    @field_validator("customer_gst")
    @classmethod
    def check_customer_gst(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip().upper()

    @field_validator("ifsc_code")
    @classmethod
    def check_invoice_ifsc(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip().upper()

    @model_validator(mode="before")
    @classmethod
    def populate_aliases_and_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("client") and data.get("customer_name"):
                data["client"] = data["customer_name"]
            if not data.get("date") and data.get("invoice_date"):
                data["date"] = data["invoice_date"]
            if "amount" not in data or data.get("amount") is None:
                if "grand_total" in data:
                    data["amount"] = data["grand_total"]
                elif "subtotal" in data:
                    data["amount"] = data["subtotal"]
                else:
                    data["amount"] = 0.0
        return data

class Invoice(InvoiceBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class PurchaseBase(BaseModel):
    purchase_name: str
    supplier_name: str
    purchase_date: str # YYYY-MM-DD
    amount: float
    status: str = "Paid" # "Paid", "Pending", "Overdue"
    category: Optional[str] = "Raw Materials"
    bill_number: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_purchase_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("purchase_name") and data.get("name"):
                data["purchase_name"] = data["name"]
            if not data.get("purchase_date") and data.get("date"):
                data["purchase_date"] = data["date"]
            if not data.get("bill_number") and data.get("purchase_number"):
                data["bill_number"] = data["purchase_number"]
            if not data.get("status") and data.get("payment_status"):
                data["status"] = data["payment_status"]
            if "amount" not in data or data.get("amount") is None:
                if "total_amount" in data:
                    data["amount"] = data["total_amount"]
                else:
                    data["amount"] = 0.0
        return data

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseUpdate(BaseModel):
    purchase_name: Optional[str] = None
    supplier_name: Optional[str] = None
    purchase_date: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    category: Optional[str] = None
    bill_number: Optional[str] = None
    notes: Optional[str] = None

class Purchase(PurchaseBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class ExpenseBase(BaseModel):
    description: str
    amount: float
    date: str # ISO string

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None

class Expense(ExpenseBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class CustomerBase(BaseModel):
    name: str
    mobile_number: str
    email: Optional[str] = None
    gst_number: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_address: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = None

    @field_validator("mobile_number")
    @classmethod
    def check_customer_mobile(cls, v: str) -> str:
        return validate_mobile_format(v)

    @field_validator("gst_number")
    @classmethod
    def check_customer_gst(cls, v: Optional[str]) -> Optional[str]:
        return validate_gstin_format(v)

    @field_validator("ifsc_code")
    @classmethod
    def check_customer_ifsc(cls, v: Optional[str]) -> Optional[str]:
        return validate_ifsc_format(v)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_address: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = None

class Customer(CustomerBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class NotificationBase(BaseModel):
    title: str
    message: str
    type: Optional[str] = "info"  # "invoice", "payment", "stock", "purchase", "customer", "warning", "info"
    link: Optional[str] = None
    is_read: Optional[bool] = False
    created_at: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class SalaryBase(BaseModel):
    labour_id: str
    labour_custom_id: Optional[str] = None
    labour_name: str
    work_type: Optional[str] = "Full Time"
    month: int # 1 - 12
    year: int  # e.g. 2026
    salary_amount: float
    status: str = "Pending" # "Paid" | "Pending"
    payment_date: Optional[str] = None
    payment_mode: Optional[str] = "Bank Transfer (NEFT)"
    notes: Optional[str] = None

class SalaryUpdate(BaseModel):
    salary_amount: Optional[float] = None
    status: Optional[str] = None
    payment_date: Optional[str] = None
    payment_mode: Optional[str] = None
    notes: Optional[str] = None

class Salary(SalaryBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
