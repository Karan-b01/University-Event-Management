from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.resource import (
    ResourceCreate,
    ResourceResponse,
    BookingCreate,
    BookingResponse,
    DamageReportCreate,
    DamageReportResponse,
)
from app.services.resource_service import ResourceService
from app.core.dependencies import get_current_user, require_role

router = APIRouter(
    prefix="/resources",
    tags=["Module 4: Resource Management & Concurrency Booking"]
)


@router.get(
    "/",
    response_model=List[ResourceResponse],
    status_code=status.HTTP_200_OK,
    summary="List all university resources",
    description="Lists all resources (Venues, Equipment, Transport, Accommodation) with optional filters by type and status."
)
def list_resources(
    resource_type: Optional[str] = Query(None, alias="type", description="Filter by type: 'Venue', 'Equipment', 'Transport', 'Accommodation'"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: 'Available', 'Booked', 'Maintenance'"),
    db: Session = Depends(get_db)
):
    """Public/Authenticated endpoint to list resources."""
    return ResourceService.list_resources(db, resource_type=resource_type, status_filter=status_filter)


@router.post(
    "/",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resource asset",
    dependencies=[Depends(require_role(["Admin", "Faculty Advisor"]))]
)
def create_resource(
    resource_in: ResourceCreate,
    db: Session = Depends(get_db)
):
    """Creates a new university asset (Admin / Faculty role)."""
    return ResourceService.create_resource(db, resource_in)


@router.post(
    "/book",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book a resource (Pessimistic Concurrency Locking)",
    description=(
        "Locks the target resource row via .with_for_update() and validates against overlapping "
        "confirmed reservations. Returns 409 Conflict if an overlap occurs."
    ),
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def book_resource(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Protected booking endpoint with database-level row locking."""
    booking = ResourceService.book_resource(
        db=db,
        user=current_user,
        booking_in=booking_in
    )
    return booking


@router.post(
    "/bookings/{booking_id}/cancel",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel a resource booking",
    description="Updates the booking status to 'Cancelled' and frees up the reservation time slot."
)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to cancel an existing booking."""
    return ResourceService.cancel_booking(db=db, booking_id=booking_id, user=current_user)


@router.post(
    "/{resource_id}/damage",
    response_model=DamageReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="File a damage report for a resource",
    description="Logs incident description, repair estimates, and damage status for a resource."
)
def report_damage(
    resource_id: int,
    report_in: DamageReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to submit a damage report."""
    return ResourceService.report_damage(
        db=db,
        resource_id=resource_id,
        report_in=report_in
    )


@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get resource details by ID"
)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db)
):
    """Endpoint to fetch specific resource details."""
    return ResourceService.get_resource_by_id(db, resource_id)
