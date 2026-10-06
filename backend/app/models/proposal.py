import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    """Helper to return current UTC datetime."""
    return datetime.now(timezone.utc)


class EventProposal(Base):
    """
    EventProposal Model representing the core digital event proposal entity.
    """
    __tablename__ = "event_proposals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Untitled Proposal")
    status = Column(String(50), default="Draft", nullable=False, index=True)  # 'Draft', 'Submitted', 'Pending', etc.
    team_data = Column(JSON, nullable=True)  # Stores {"team_name": "...", "members": [{"name": "...", "role": "..."}]}
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # 1-to-1 composition relationships
    event_details = relationship(
        "EventDetails", 
        back_populates="proposal", 
        uselist=False, 
        cascade="all, delete-orphan", 
        lazy="joined"
    )
    schedule = relationship(
        "Schedule", 
        back_populates="proposal", 
        uselist=False, 
        cascade="all, delete-orphan", 
        lazy="joined"
    )

    # 1-to-many relationship with documents
    documents = relationship(
        "Document", 
        back_populates="proposal", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )

    # Relationship to user
    user = relationship("User", backref="proposals")

    def __repr__(self) -> str:
        return f"<EventProposal(id='{self.id}', title='{self.title}', status='{self.status}')>"


class EventDetails(Base):
    """
    EventDetails Model in 1-to-1 composition with EventProposal.
    """
    __tablename__ = "event_details"

    proposal_id = Column(String(36), ForeignKey("event_proposals.id", ondelete="CASCADE"), primary_key=True)
    description = Column(Text, nullable=True)
    objective = Column(String(500), nullable=True)
    expected_participants = Column(Integer, nullable=True)

    # Relationship back to EventProposal
    proposal = relationship("EventProposal", back_populates="event_details")

    def __repr__(self) -> str:
        return f"<EventDetails(proposal_id='{self.proposal_id}', expected_participants={self.expected_participants})>"


class Schedule(Base):
    """
    Schedule Model in 1-to-1 composition with EventProposal.
    """
    __tablename__ = "schedules"

    proposal_id = Column(String(36), ForeignKey("event_proposals.id", ondelete="CASCADE"), primary_key=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    venue_preference = Column(String(255), nullable=True)

    # Relationship back to EventProposal
    proposal = relationship("EventProposal", back_populates="schedule")

    def __repr__(self) -> str:
        return f"<Schedule(proposal_id='{self.proposal_id}', venue='{self.venue_preference}')>"


class Document(Base):
    """
    Single Table Inheritance (STI) Base Document Model mapped 1-to-Many to EventProposal.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proposal_id = Column(String(36), ForeignKey("event_proposals.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    upload_date = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    type = Column(String(50), nullable=False)

    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": "Document",
    }

    # Relationship back to EventProposal
    proposal = relationship("EventProposal", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, type='{self.type}', file_name='{self.file_name}')>"


class Poster(Document):
    """
    Polymorphic identity for Event Promotional Posters.
    """
    __mapper_args__ = {
        "polymorphic_identity": "Poster",
    }


class VendorQuotation(Document):
    """
    Polymorphic identity for Financial/Vendor Quotation Documents.
    """
    __mapper_args__ = {
        "polymorphic_identity": "VendorQuotation",
    }

