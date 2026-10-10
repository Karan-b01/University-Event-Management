from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.proposal import EventProposal
from app.models.finance import (
    Budget,
    Vendor,
    Expense,
    Receipt,
    Transaction,
    BankTransfer,
    UPITransfer,
    Cheque,
)
from app.schemas.finance import (
    BudgetCreate,
    BudgetUpdate,
    VendorCreate,
    ExpenseCreate,
    PaymentRequest,
)
from app.services.gateways import payment_gateway


class FinanceService:
    """
    Business logic for Event Budgets, Vendor Disbursements, Duplicate Receipt Detection,
    Budget Overrun Tracking, and Payment Gateway Integration.
    """

    @staticmethod
    def create_vendor(db: Session, vendor_in: VendorCreate) -> Vendor:
        """Create a new registered vendor."""
        vendor = Vendor(
            name=vendor_in.name,
            email=vendor_in.email,
            bank_details=vendor_in.bank_details,
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        return vendor

    @staticmethod
    def list_vendors(db: Session) -> List[Vendor]:
        """List all registered vendors."""
        return db.query(Vendor).all()

    @staticmethod
    def create_budget(db: Session, budget_in: BudgetCreate) -> Budget:
        """
        Creates a sanctioned budget for an EventProposal.
        Verifies that proposal exists and doesn't already have an active budget.
        """
        proposal = db.query(EventProposal).filter(EventProposal.id == budget_in.proposal_id).first()
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event proposal with ID '{budget_in.proposal_id}' not found."
            )

        existing_budget = db.query(Budget).filter(Budget.proposal_id == budget_in.proposal_id).first()
        if existing_budget:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A budget has already been created for proposal '{budget_in.proposal_id}'."
            )

        budget = Budget(
            proposal_id=budget_in.proposal_id,
            allocated_amount=budget_in.allocated_amount,
            current_spent=0.0,
            status="Approved" if proposal.status in ["Submitted", "Approved"] else "Pending",
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    @staticmethod
    def get_budget_by_proposal_id(db: Session, proposal_id: str) -> Budget:
        """Retrieve budget by event proposal ID."""
        budget = db.query(Budget).filter(Budget.proposal_id == proposal_id).first()
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget for proposal '{proposal_id}' not found."
            )
        return budget

    @staticmethod
    def request_expense_receipt(db: Session, expense_id: int) -> Expense:
        expense = db.query(Expense).filter(Expense.id == expense_id).with_for_update().first()
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
        if expense.status == "Paid":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A receipt cannot be requested for a paid expense.")
        if expense.receipts:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A receipt has already been uploaded for this expense.")
        expense.status = "Receipt Requested"
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def submit_expense(db: Session, user: User, expense_in: ExpenseCreate) -> Expense:
        """
        Submits a new Expense line item:
        1. Validates Budget existence.
        2. Duplicate Receipt Detection:
           Checks if any existing Expense + Receipt shares the identical (vendor_id, amount, receipt_date).
           If exact match exists -> raises HTTP 400 Bad Request.
        3. Budget Overrun Logic:
           Checks if (budget.current_spent + expense_in.amount > budget.allocated_amount).
           If true -> flags budget.status = 'Overrun'.
        4. Persists Expense, Sub-Expense hierarchy (if parent_expense_id is set), and attached Receipt.
        """
        budget = db.query(Budget).filter(Budget.id == expense_in.budget_id).first()
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget with ID {expense_in.budget_id} not found."
            )

        # Validate parent expense if provided (Sub-Expense hierarchy)
        if expense_in.parent_expense_id:
            parent = db.query(Expense).filter(Expense.id == expense_in.parent_expense_id).first()
            if not parent or parent.budget_id != expense_in.budget_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid parent expense ID {expense_in.parent_expense_id} for this budget."
                )

        # Duplicate Receipt Detection Logic
        if expense_in.vendor_id and expense_in.receipt:
            duplicate_query = (
                db.query(Expense)
                .join(Receipt, Expense.id == Receipt.expense_id)
                .filter(
                    Expense.vendor_id == expense_in.vendor_id,
                    Expense.amount == expense_in.amount,
                    Receipt.date == expense_in.receipt.date,
                    Expense.status != "Rejected"
                )
                .first()
            )
            if duplicate_query:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Duplicate Expense Detected: An identical expense with Vendor ID {expense_in.vendor_id}, "
                        f"Amount ${expense_in.amount:.2f}, and Receipt Date '{expense_in.receipt.date}' has already been submitted."
                    )
                )

        # Budget Overrun Check (checks current_spent + new_expense as well as cumulative committed expenses)
        existing_unpaid_sum = sum(e.amount for e in budget.expenses if e.status in ["Submitted", "Verified"])
        projected_total = budget.current_spent + existing_unpaid_sum + expense_in.amount
        if (budget.current_spent + expense_in.amount > budget.allocated_amount) or (projected_total > budget.allocated_amount):
            budget.status = "Overrun"
            print(f"[Finance Alert] Budget ID {budget.id} flagged as OVERRUN. Allocated: ${budget.allocated_amount:.2f}, Projected: ${projected_total:.2f}")

        # Create Expense Record
        new_expense = Expense(
            budget_id=budget.id,
            vendor_id=expense_in.vendor_id,
            amount=expense_in.amount,
            category=expense_in.category,
            status="Submitted",
            parent_expense_id=expense_in.parent_expense_id,
        )
        db.add(new_expense)
        db.flush()

        # Attach Receipt if provided
        if expense_in.receipt:
            new_receipt = Receipt(
                expense_id=new_expense.id,
                file_path=expense_in.receipt.file_path,
                amount=expense_in.receipt.amount or expense_in.amount,
                date=expense_in.receipt.date,
                is_verified=False,
            )
            db.add(new_receipt)

        db.commit()
        db.refresh(new_expense)
        return new_expense

    @staticmethod
    def pay_expense(
        db: Session,
        expense_id: int,
        payment_req: PaymentRequest,
        user: User
    ) -> dict:
        """
        Finance Officer Disbursement Workflow:
        1. Validates Expense existence and status ('Submitted' or 'Verified').
        2. Gathers vendor payment details.
        3. Triggers UniversityPaymentGatewayAdapter with network latency.
        4. Creates a polymorphic Transaction record (BankTransfer, UPITransfer, or Cheque).
        5. Updates Expense status to 'Paid'.
        6. Increments budget.current_spent by expense.amount and re-checks Overrun status.
        """
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found."
            )

        if expense.status == "Paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expense ID {expense_id} has already been paid."
            )

        if expense.status == "Rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot pay a rejected expense."
            )

        # Prepare payment details for gateway adapter
        account_details = {
            "vendor_id": expense.vendor_id,
            "vendor_name": expense.vendor.name if expense.vendor else "Direct Reimbursement",
            "payment_type": payment_req.payment_type,
            "bank_account": payment_req.bank_account,
            "ifsc": payment_req.ifsc,
            "upi_id": payment_req.upi_id,
            "cheque_number": payment_req.cheque_number,
        }

        # Trigger UniversityPaymentGatewayAdapter
        gateway_response = payment_gateway.process_payment(
            amount=expense.amount,
            account_details=account_details
        )

        if gateway_response.get("status") != "success":
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Payment Gateway rejected the transaction."
            )

        txn_ref = gateway_response.get("transaction_id")

        # Create Single Table Inheritance Transaction record
        type_mapping = {
            "BankTransfer": BankTransfer,
            "UPITransfer": UPITransfer,
            "Cheque": Cheque,
        }
        txn_cls = type_mapping.get(payment_req.payment_type, Transaction)

        transaction = txn_cls(
            expense_id=expense.id,
            amount=expense.amount,
            type=payment_req.payment_type,
            status="Success",
            transaction_ref=txn_ref,
            bank_account=payment_req.bank_account,
            ifsc=payment_req.ifsc,
            upi_id=payment_req.upi_id,
            cheque_number=payment_req.cheque_number,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(transaction)

        # Update Expense status
        expense.status = "Paid"

        # Increment Budget current_spent
        budget = expense.budget
        budget.current_spent += expense.amount
        if budget.current_spent > budget.allocated_amount:
            budget.status = "Overrun"
        budget.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(expense)
        db.refresh(transaction)
        db.refresh(budget)

        return {
            "message": "Payment disbursed successfully via University Payment Gateway.",
            "transaction_id": txn_ref,
            "expense_id": expense.id,
            "amount_paid": expense.amount,
            "payment_type": payment_req.payment_type,
            "expense_status": expense.status,
            "budget_spent": budget.current_spent,
            "budget_allocated": budget.allocated_amount,
            "budget_status": budget.status,
        }
