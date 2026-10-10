from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# Resource Schemas (Polymorphic / STI)
# ==========================================

class ResourceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Name of the university resource")
    type: str = Field(..., description="Resource polymorphic type: 'Venue', 'Equipment', 'Transport', 'Accommodation'")
    status: Optional[str] = Field("Available", description="'Available', 'Booked', 'Maintenance'")


class VenueCreate(BaseModel):
    name: str
    type: str = "Venue"
    capacity: int = Field(..., ge=1, description="Seating or standing capacity")
    location: str = Field(..., description="Campus building / hall location")
    status: Optional[str] = "Available"


class EquipmentCreate(BaseModel):
    name: str
    type: str = "Equipment"
    equipment_type: str = Field(..., description="e.g. Audio, Video, Lighting, Stage")
    condition: str = Field(default="Good", description="Condition of the equipment")
    status: Optional[str] = "Available"


class TransportCreate(BaseModel):
    name: str
    type: str = "Transport"
    vehicle_no: str = Field(..., description="Vehicle registration / license number")
    driver: str = Field(..., description="Designated driver name")
    status: Optional[str] = "Available"


class AccommodationCreate(BaseModel):
    name: str
    type: str = "Accommodation"
    room_count: int = Field(..., ge=1, description="Number of rooms available")
    building: str = Field(..., description="Hostel/Guest house building name")
    status: Optional[str] = "Available"


class ResourceCreate(BaseModel):
    name: str
    type: str
    status: Optional[str] = "Available"
    capacity: Optional[int] = None
    location: Optional[str] = None
    equipment_type: Optional[str] = None
    condition: Optional[str] = None
    vehicle_no: Optional[str] = None
    driver: Optional[str] = None
    room_count: Optional[int] = None
    building: Optional[str] = None


class ResourceResponse(BaseModel):
    id: int
    name: str
    type: str
    status: str
    capacity: Optional[int] = None
    location: Optional[str] = None
    equipment_type: Optional[str] = None
    condition: Optional[str] = None
    vehicle_no: Optional[str] = None
    driver: Optional[str] = None
    room_count: Optional[int] = None
    building: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Booking Schemas
# ==========================================

class BookingCreate(BaseModel):
    resource_id: int = Field(..., description="Target Resource ID to book")
    start_time: datetime = Field(..., description="Reservation start timestamp (UTC)")
    end_time: datetime = Field(..., description="Reservation end timestamp (UTC)")


class BookingResponse(BaseModel):
    id: int
    user_id: int
    resource_id: int
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime
    resource: Optional[ResourceResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Damage Report Schemas
# ==========================================

class DamageReportCreate(BaseModel):
    description: str = Field(..., min_length=5, description="Detailed description of the incident / damage")
    image_path: Optional[str] = Field(None, description="Optional relative path or URL to uploaded damage photo")
    estimated_cost: Optional[float] = Field(None, ge=0.0, description="Estimated repair/replacement cost")


class DamageReportResponse(BaseModel):
    id: int
    resource_id: int
    description: str
    image_path: Optional[str] = None
    report_date: datetime
    estimated_cost: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Resource Availability Schemas
# ==========================================

class ConflictInfo(BaseModel):
    start_time: datetime
    end_time: datetime


class AvailabilityResponse(BaseModel):
    available: bool
    reason: str
    resource_id: Optional[int] = None
    resource_name: Optional[str] = None
    conflict: Optional[ConflictInfo] = None
    booked_venues: List[str] = Field(default_factory=list)
    available_venues: List[str] = Field(default_factory=list)

