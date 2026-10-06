import uuid
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    """Helper to return current UTC datetime."""
    return datetime.now(timezone.utc)


class Budget(Base):
    """
    Budget Model representing allocated funds for an EventProposal (1-to-1).
    """
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proposal_id = Column(String(36), ForeignKey("event_proposals.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    allocated_amount = Column(Float, nullable=False)
    current_spent = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Pending", nullable=False, index=True)  # 'Pending', 'Approved', 'Overrun'
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    proposal = relationship("EventProposal", backref="budget", uselist=False)
    expenses = relationship("Expense", back_populates="budget", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, proposal_id='{self.proposal_id}', allocated={self.allocated_amount}, spent={self.current_spent}, status='{self.status}')>"


class Vendor(Base):
    """
    Vendor Model representing external service providers, contractors, and suppliers.
    """
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    bank_details = Column(String(255), nullable=False)  # Bank account, IFSC, or UPI info

    # Relationships
    expenses = relationship("Expense", back_populates="vendor")

    def __repr__(self) -> str:
        return f"<Vendor(id={self.id}, name='{self.name}', email='{self.email}')>"


class Expense(Base):
    """
    Expense Model for line items under a Budget, supporting self-referential sub-expenses.
    """
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    budget_id = Column(Integer, ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)  # 'Catering', 'Logistics', 'Honorarium', 'Printing', etc.
    status = Column(String(50), default="Submitted", nullable=False, index=True)  # 'Submitted', 'Verified', 'Rejected', 'Paid'
    parent_expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    budget = relationship("Budget", back_populates="expenses")
    vendor = relationship("Vendor", back_populates="expenses")
    receipts = relationship("Receipt", back_populates="expense", cascade="all, delete-orphan", lazy="selectin")
    
    # Self-referential relationship for Sub-Expenses
    parent_expense = relationship("Expense", remote_side=[id], backref="sub_expenses")
    transactions = relationship("Transaction", back_populates="expense", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, budget_id={self.budget_id}, amount={self.amount}, status='{self.status}')>"


class Receipt(Base):
    """
    Receipt Model storing proof of expense, verification flag, and file attachment (1-to-many with Expense).
    """
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationship back to Expense
    expense = relationship("Expense", back_populates="receipts")

    def __repr__(self) -> str:
        return f"<Receipt(id={self.id}, expense_id={self.expense_id}, amount={self.amount}, date={self.date}, is_verified={self.is_verified})>"


class Transaction(Base):
    """
    Single Table Inheritance (STI) Base Model for Financial Dispatches and Payments.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    type = Column(String(50), nullable=False, index=True)  # Discriminator column
    status = Column(String(50), default="Success", nullable=False)  # 'Success', 'Pending', 'Failed'
    transaction_ref = Column(String(100), nullable=True, unique=True, index=True)

    # BankTransfer specific fields
    bank_account = Column(String(50), nullable=True)
    ifsc = Column(String(20), nullable=True)

    # UPITransfer specific fields
    upi_id = Column(String(100), nullable=True)

    # Cheque specific fields
    cheque_number = Column(String(50), nullable=True)

    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": "Transaction",
    }

    # Relationship back to Expense
    expense = relationship("Expense", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, type='{self.type}', amount={self.amount}, status='{self.status}')>"


class BankTransfer(Transaction):
    """
    Bank Transfer Payment (NEFT/RTGS/IMPS).
    """
    __mapper_args__ = {
        "polymorphic_identity": "BankTransfer",
    }


class UPITransfer(Transaction):
    """
    Instant UPI Virtual Payment Address (VPA) Transfer.
    """
    __mapper_args__ = {
        "polymorphic_identity": "UPITransfer",
    }


class Cheque(Transaction):
    """
    Physical / Cleared Cheque Payment.
    """
    __mapper_args__ = {
        "polymorphic_identity": "Cheque",
    }
