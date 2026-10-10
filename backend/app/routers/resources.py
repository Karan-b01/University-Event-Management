from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.resource import Booking, Resource
from app.schemas.resource import (
    ResourceCreate,
    ResourceResponse,
    BookingCreate,
    BookingResponse,
    DamageReportCreate,
    DamageReportResponse,
    AvailabilityResponse,
    ConflictInfo,
)
from app.services.resource_service import ResourceService
from app.core.dependencies import get_current_user, require_role

router = APIRouter(
    prefix="/resources",
    tags=["Module 4: Resource Management & Concurrency Booking"]
)


@router.get(
    "/check-availability",
    response_model=AvailabilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Check resource/venue availability for a given time window",
    description="Validates if a venue or resource has any conflicting confirmed bookings during the requested interval."
)
def check_availability(
    start_time: datetime = Query(..., description="Start timestamp (ISO format)"),
    end_time: datetime = Query(..., description="End timestamp (ISO format)"),
    venue_name: Optional[str] = Query(None, description="Name of the venue/resource to check"),
    resource_id: Optional[int] = Query(None, description="ID of the resource to check"),
    db: Session = Depends(get_db)
):
    """Validates real-time venue availability and returns any clashing intervals."""
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be strictly before end time."
        )

    all_venues = db.query(Resource).filter(Resource.type == "Venue").all()

    clashing_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "Confirmed",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        )
        .all()
    )
    booked_resource_ids = {b.resource_id for b in clashing_bookings}

    booked_venues = []
    available_venues = []
    for v in all_venues:
        if v.id in booked_resource_ids or v.status == "Maintenance":
            booked_venues.append(v.name)
        else:
            available_venues.append(v.name)

    target_resource = None
    if resource_id is not None:
        target_resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not target_resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resource with ID {resource_id} not found."
            )
    elif venue_name and venue_name.strip():
        target_resource = db.query(Resource).filter(func.lower(Resource.name) == venue_name.strip().lower()).first()

    if target_resource:
        if target_resource.status == "Maintenance":
            return AvailabilityResponse(
                available=False,
                reason=f"Resource '{target_resource.name}' is currently under Maintenance and unavailable.",
                resource_id=target_resource.id,
                resource_name=target_resource.name,
                booked_venues=booked_venues,
                available_venues=available_venues,
            )

        target_clash = next((b for b in clashing_bookings if b.resource_id == target_resource.id), None)
        if target_clash:
            clash_start = target_clash.start_time.strftime("%b %d, %Y %H:%M")
            clash_end = target_clash.end_time.strftime("%H:%M")
            return AvailabilityResponse(
                available=False,
                reason=f"'{target_resource.name}' is already booked for this time slot ({clash_start} to {clash_end}).",
                resource_id=target_resource.id,
                resource_name=target_resource.name,
                conflict=ConflictInfo(start_time=target_clash.start_time, end_time=target_clash.end_time),
                booked_venues=booked_venues,
                available_venues=available_venues,
            )
        return AvailabilityResponse(
            available=True,
            reason=f"'{target_resource.name}' is available for your requested time slot.",
            resource_id=target_resource.id,
            resource_name=target_resource.name,
            booked_venues=booked_venues,
            available_venues=available_venues,
        )

    return AvailabilityResponse(
        available=len(available_venues) > 0,
        reason=f"{len(available_venues)} venue(s) currently available for this time window.",
        booked_venues=booked_venues,
        available_venues=available_venues,
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
    dependencies=[Depends(require_role(["Admin", "Faculty Advisor", "Resource Manager"]))]
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
    dependencies=[Depends(require_role(["Student Organizer", "Resource Manager", "Admin"]))]
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


@router.get(
    "/bookings",
    response_model=List[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="List resource bookings",
    description="Returns the current user's bookings, or all bookings for resource administrators."
)
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = {role.role_name for role in current_user.roles}
    query = db.query(Booking)
    if not roles.intersection({"Admin", "Faculty Advisor", "Resource Manager"}):
        query = query.filter(Booking.user_id == current_user.id)
    return query.order_by(Booking.start_time.desc()).all()


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

