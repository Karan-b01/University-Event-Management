from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.finance import Budget, Expense, Vendor
from app.schemas.finance import (
    BudgetCreate,
    BudgetResponse,
    VendorCreate,
    VendorResponse,
    ExpenseCreate,
    ExpenseResponse,
    PaymentRequest,
)
from app.services.finance_service import FinanceService
from app.core.dependencies import get_current_user, require_role

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


@router.get(
    "/expenses",
    response_model=List[ExpenseResponse],
    status_code=status.HTTP_200_OK,
    summary="List expenses for a budget"
)
def list_expenses(
    budget_id: Optional[int] = Query(None, description="Filter expenses by budget ID"),
    db: Session = Depends(get_db)
):
    """Query expenses with optional budget filter."""
    query = db.query(Expense)
    if budget_id:
        query = query.filter(Expense.budget_id == budget_id)
    return query.all()


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

