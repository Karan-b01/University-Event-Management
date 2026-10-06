from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    """Helper to return current UTC datetime."""
    return datetime.now(timezone.utc)


class Resource(Base):
    """
    Single Table Inheritance (STI) Base Model for University Assets and Resources.
    """
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # Discriminator column
    status = Column(String(50), default="Available", nullable=False, index=True)  # 'Available', 'Booked', 'Maintenance'

    # Venue specific fields
    capacity = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)

    # Equipment specific fields
    equipment_type = Column(String(100), nullable=True)
    condition = Column(String(100), nullable=True)

    # Transport specific fields
    vehicle_no = Column(String(50), nullable=True)
    driver = Column(String(100), nullable=True)

    # Accommodation specific fields
    room_count = Column(Integer, nullable=True)
    building = Column(String(100), nullable=True)

    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": "Resource",
    }

    # Relationships
    bookings = relationship("Booking", back_populates="resource", cascade="all, delete-orphan", lazy="selectin")
    damage_reports = relationship("DamageReport", back_populates="resource", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Resource(id={self.id}, name='{self.name}', type='{self.type}', status='{self.status}')>"


class Venue(Resource):
    """
    Venue Resource (e.g. Auditorium, Seminar Hall, Open Grounds).
    """
    __mapper_args__ = {
        "polymorphic_identity": "Venue",
    }


class Equipment(Resource):
    """
    Equipment Resource (e.g. Sound Systems, Projectors, Microphones).
    """
    __mapper_args__ = {
        "polymorphic_identity": "Equipment",
    }


class Transport(Resource):
    """
    Transport Resource (e.g. University Buses, Vans).
    """
    __mapper_args__ = {
        "polymorphic_identity": "Transport",
    }


class Accommodation(Resource):
    """
    Accommodation Resource (e.g. Guest House, Hostels).
    """
    __mapper_args__ = {
        "polymorphic_identity": "Accommodation",
    }


class Booking(Base):
    """
    Booking Model representing a scheduled reservation of a University Resource.
    """
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(50), default="Confirmed", nullable=False, index=True)  # 'Confirmed', 'Cancelled'
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", backref="bookings")
    resource = relationship("Resource", back_populates="bookings")

    def __repr__(self) -> str:
        return f"<Booking(id={self.id}, user_id={self.user_id}, resource_id={self.resource_id}, status='{self.status}')>"


class DamageReport(Base):
    """
    DamageReport Model for logging incidents, damage description, and repair estimates.
    """
    __tablename__ = "damage_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    report_date = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    estimated_cost = Column(Float, nullable=True)

    # Relationship to Resource
    resource = relationship("Resource", back_populates="damage_reports")

    def __repr__(self) -> str:
        return f"<DamageReport(id={self.id}, resource_id={self.resource_id}, estimated_cost={self.estimated_cost})>"

