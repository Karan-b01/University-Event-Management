from typing import List, Optional
from datetime import date
import os
import uuid
from fastapi import APIRouter, Depends, status, Query, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.finance import Budget, Expense, Receipt, Vendor
from app.schemas.finance import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    VendorCreate,
    VendorResponse,
    ExpenseCreate,
    ExpenseResponse,
    PaymentRequest,
)
from app.services.finance_service import FinanceService
from app.core.dependencies import get_current_user, require_role
from app.core.document_access import can_view_document

router = APIRouter(
    prefix="/finance",
    tags=["Module 3: Finance Management & Payment Gateway"]
)


# ==========================================
# Vendor Endpoints
# ==========================================

@router.post(
    "/vendors",
    response_model=VendorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vendor",
    dependencies=[Depends(require_role(["Finance Officer", "Admin", "Student Organizer"]))]
)
def create_vendor(
    vendor_in: VendorCreate,
    db: Session = Depends(get_db)
):
    """Register an external vendor for financial disbursements."""
    return FinanceService.create_vendor(db, vendor_in)


@router.get(
    "/vendors",
    response_model=List[VendorResponse],
    status_code=status.HTTP_200_OK,
    summary="List all registered vendors"
)
def list_vendors(db: Session = Depends(get_db)):
    """Retrieve list of registered university vendors."""
    return FinanceService.list_vendors(db)


# ==========================================
# Budget Endpoints
# ==========================================

@router.post(
    "/budgets",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create event budget (Finance Officer only)",
    description="Allocates sanctioned funds for an approved event proposal.",
    dependencies=[Depends(require_role(["Finance Officer", "Admin"]))]
)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db)
):
    """Sanction and create a budget for an event proposal."""
    return FinanceService.create_budget(db, budget_in)


@router.get(
    "/budgets/{proposal_id}",
    response_model=BudgetResponse,
    status_code=status.HTTP_200_OK,
    summary="Get budget details by proposal ID"
)
def get_budget(
    proposal_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve budget and line item expenditures for a proposal."""
    return FinanceService.get_budget_by_proposal_id(db, proposal_id)


@router.put(
    "/budgets/{proposal_id}",
    response_model=BudgetResponse,
    dependencies=[Depends(require_role(["Finance Officer", "Admin"]))],
    summary="Record the disbursed amount for a requested event budget",
)
def update_budget_disbursement(
    proposal_id: str,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
):
    return FinanceService.update_budget_disbursement(db, proposal_id, budget_in)


@router.get(
    "/budgets",
    response_model=List[BudgetResponse],
    status_code=status.HTTP_200_OK,
    summary="List all budgets"
)
def list_budgets(db: Session = Depends(get_db)):
    """Retrieve list of all event budgets."""
    return db.query(Budget).all()



# ==========================================
# Expense Endpoints
# ==========================================

@router.post(
    "/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an expense with duplicate receipt detection",
    description=(
        "Submits a new expense line item. Automatically checks for duplicate receipts "
        "(identical vendor, amount, date) and triggers Budget Overrun detection."
    ),
    dependencies=[Depends(require_role(["Student Organizer", "Finance Officer", "Admin"]))]
)
def submit_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an expense with duplicate prevention and overrun checks."""
    return FinanceService.submit_expense(db, current_user, expense_in)


@router.post(
    "/expenses/with-receipt",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an expense with an uploaded receipt",
    dependencies=[Depends(require_role(["Student Organizer", "Finance Officer", "Admin"]))]
)
async def submit_expense_with_receipt(
    budget_id: int = Form(...),
    amount: float = Form(..., gt=0),
    category: Optional[str] = Form("Operational"),
    vendor_id: Optional[int] = Form(None),
    receipt_amount: Optional[float] = Form(None, gt=0),
    receipt_date: str = Form(...),
    receipt_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}
    extension = os.path.splitext(receipt_file.filename or "")[1].lower()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Receipt must be a PDF or image file.")

    content = await receipt_file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Receipt file must be 10 MB or smaller.")

    receipt_dir = os.path.join(os.getcwd(), "uploads", "receipts")
    os.makedirs(receipt_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}{extension}"
    receipt_path = os.path.join(receipt_dir, safe_name)
    with open(receipt_path, "wb") as receipt_handle:
        receipt_handle.write(content)

    try:
        expense_in = ExpenseCreate(
            budget_id=budget_id,
            vendor_id=vendor_id,
            amount=amount,
            category=category,
            receipt={
                "amount": receipt_amount or amount,
                "date": receipt_date,
                "file_path": os.path.relpath(receipt_path, os.getcwd()),
            },
        )
        return FinanceService.submit_expense(db, current_user, expense_in)
    except Exception:
        if os.path.exists(receipt_path):
            os.remove(receipt_path)
        raise


@router.post(
    "/expenses/{expense_id}/request-receipt",
    response_model=ExpenseResponse,
    dependencies=[Depends(require_role(["Finance Officer", "Admin"]))],
    summary="Request supporting receipt from the student organizer",
)
def request_expense_receipt(expense_id: int, db: Session = Depends(get_db)):
    return FinanceService.request_expense_receipt(db, expense_id)


@router.post(
    "/expenses/{expense_id}/receipt",
    response_model=ExpenseResponse,
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))],
    summary="Upload a receipt requested by Finance",
)
async def upload_requested_receipt(
    expense_id: int,
    amount: float = Form(..., gt=0),
    receipt_date: date = Form(...),
    receipt_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    extension = os.path.splitext(receipt_file.filename or "")[1].lower()
    if extension not in {".pdf", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=400, detail="Receipt must be a PDF or image file.")
    content = await receipt_file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Receipt file must be 10 MB or smaller.")

    receipt_dir = os.path.join(os.getcwd(), "uploads", "receipts")
    os.makedirs(receipt_dir, exist_ok=True)
    receipt_path = os.path.join(receipt_dir, f"{uuid.uuid4().hex}{extension}")
    with open(receipt_path, "wb") as receipt_handle:
        receipt_handle.write(content)
    try:
        return FinanceService.attach_requested_receipt(
            db, expense_id, current_user, amount, receipt_date,
            os.path.relpath(receipt_path, os.getcwd()),
        )
    except Exception:
        if os.path.exists(receipt_path):
            os.remove(receipt_path)
        raise


@router.get(
    "/expenses",
    response_model=List[ExpenseResponse],
    status_code=status.HTTP_200_OK,
    summary="List expenses for a budget"
)
def list_expenses(
    budget_id: Optional[int] = Query(None, description="Filter expenses by budget ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query expenses with optional budget filter."""
    query = db.query(Expense)
    if budget_id:
        query = query.filter(Expense.budget_id == budget_id)
    roles = {role.role_name for role in current_user.roles}
    can_view_receipts = bool(roles.intersection({"Student", "Student Organizer", "Finance Officer", "Admin"}))
    results = []
    for expense in query.all():
        response = ExpenseResponse.model_validate(expense)
        if not can_view_receipts:
            response.receipts = []
        elif not roles.intersection({"Finance Officer", "Admin"}) and roles.intersection({"Student", "Student Organizer"}):
            if expense.budget.proposal.user_id != current_user.id:
                response.receipts = []
        results.append(response)
    return results


@router.get("/receipts/{receipt_id}/download", response_class=FileResponse, summary="Download an authorized receipt")
def download_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found.")
    if not can_view_document(current_user, receipt):
        raise HTTPException(status_code=403, detail="You cannot view this receipt.")
    roles = {role.role_name for role in current_user.roles}
    if not roles.intersection({"Finance Officer", "Admin"}) and receipt.expense.budget.proposal.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This receipt does not belong to your proposal.")
    if not os.path.isfile(receipt.file_path):
        raise HTTPException(status_code=404, detail="Receipt file is unavailable.")
    return FileResponse(receipt.file_path, filename=os.path.basename(receipt.file_path))


@router.post(
    "/expenses/{expense_id}/pay",
    status_code=status.HTTP_200_OK,
    summary="Disburse payment to vendor (Finance Officer only)",
    description=(
        "Triggers the UniversityPaymentGatewayAdapter to disburse funds. "
        "Records a polymorphic Transaction (BankTransfer, UPITransfer, Cheque), updates expense status to 'Paid', "
        "and increments budget.current_spent."
    ),
    dependencies=[Depends(require_role(["Finance Officer", "Admin"]))]
)
def pay_expense(
    expense_id: int,
    payment_req: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Finance Officer payment disbursement endpoint."""
    return FinanceService.pay_expense(
        db=db,
        expense_id=expense_id,
        payment_req=payment_req,
        user=current_user
    )

