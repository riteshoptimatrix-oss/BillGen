from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Annotated, List, Dict, Any
from pydantic.functional_validators import BeforeValidator

# Helper for MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    price: float = 0.0
    stock: int = 0
    category: Optional[str] = "Chassis & Frame"
    unit: Optional[str] = "Piece (Pcs)"
    hsn_code: Optional[str] = "HSN8708"
    tax_rate: Optional[float] = 18.0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    hsn_code: Optional[str] = None
    tax_rate: Optional[float] = None

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
    status: str = "Pending" # "Paid", "Pending", "Overdue"
    
    # Customer Bank Details
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = None
    
    notes: Optional[str] = None

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
    status: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    account_type: Optional[str] = None
    notes: Optional[str] = None

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
