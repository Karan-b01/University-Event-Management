import datetime as dt
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ==========================================
# Vendor Schemas
# ==========================================

class VendorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    bank_details: str = Field(..., description="Bank Account Number, IFSC, or UPI VPA")


class VendorCreate(VendorBase):
    pass


class VendorResponse(VendorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Receipt Schemas
# ==========================================

class ReceiptBase(BaseModel):
    date: dt.date = Field(..., description="Invoice / Receipt date")
    file_path: str = Field(..., description="Uploaded invoice document or image path")


class ReceiptCreate(ReceiptBase):
    amount: Optional[float] = Field(None, gt=0.0, description="Optional receipt total; defaults to the expense amount")


class ReceiptResponse(ReceiptBase):
    amount: float
    id: int
    expense_id: int
    is_verified: bool
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Transaction Schemas (Single Table Inheritance)
# ==========================================

class PaymentRequest(BaseModel):
    payment_type: str = Field("BankTransfer", description="'BankTransfer', 'UPITransfer', or 'Cheque'")
    bank_account: Optional[str] = Field(None, description="Target bank account number")
    ifsc: Optional[str] = Field(None, description="IFSC code")
    upi_id: Optional[str] = Field(None, description="UPI ID (e.g. vendor@upi)")
    cheque_number: Optional[str] = Field(None, description="Cheque reference number")


class TransactionResponse(BaseModel):
    id: int
    expense_id: Optional[int] = None
    amount: float
    timestamp: dt.datetime
    type: str
    status: str
    transaction_ref: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc: Optional[str] = None
    upi_id: Optional[str] = None
    cheque_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Expense Schemas (with Sub-Expenses)
# ==========================================

class ExpenseBase(BaseModel):
    budget_id: int
    vendor_id: Optional[int] = None
    amount: float = Field(..., gt=0.0)
    category: str = Field(..., description="'Catering', 'Logistics', 'Honorarium', 'Printing', etc.")
    parent_expense_id: Optional[int] = Field(None, description="Parent expense ID if this is a sub-expense")


class ExpenseCreate(ExpenseBase):
    receipt: Optional[ReceiptCreate] = Field(None, description="Optional attached receipt details for duplicate check")


class ExpenseResponse(BaseModel):
    id: int
    budget_id: int
    vendor_id: Optional[int] = None
    amount: float
    category: str
    status: str
    parent_expense_id: Optional[int] = None
    created_at: dt.datetime
    vendor: Optional[VendorResponse] = None
    receipts: List[ReceiptResponse] = []
    transactions: List[TransactionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Budget Schemas
# ==========================================

class BudgetBase(BaseModel):
    proposal_id: str
    allocated_amount: float = Field(..., gt=0.0, description="Total sanctioned budget amount")
    reduction_reason: Optional[str] = Field(None, description="Reason if disbursed amount is reduced")


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    allocated_amount: Optional[float] = Field(None, gt=0.0)
    status: Optional[str] = Field(None, description="'Pending', 'Approved', 'Overrun'")
    reduction_reason: Optional[str] = Field(None, description="Reason if disbursed budget is less than requested")


class BudgetResponse(BaseModel):
    id: int
    proposal_id: str
    allocated_amount: float
    current_spent: float
    status: str
    reduction_reason: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime
    expenses: List[ExpenseResponse] = []

    model_config = ConfigDict(from_attributes=True)
