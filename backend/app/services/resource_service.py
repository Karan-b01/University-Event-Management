from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.user import User
from app.models.resource import (
    Resource,
    Venue,
    Equipment,
    Transport,
    Accommodation,
    Booking,
    DamageReport,
)
from app.schemas.resource import (
    ResourceCreate,
    BookingCreate,
    DamageReportCreate,
)


class ResourceService:
    """
    Business logic and concurrency control for University Resources,
    Pessimistic Row-Level Locking, Overlap Detection, and Damage Reporting.
    """

    @staticmethod
    def create_resource(db: Session, resource_in: ResourceCreate) -> Resource:
        """Create a new resource asset with polymorphic identity."""
        type_mapping = {
            "Venue": Venue,
            "Equipment": Equipment,
            "Transport": Transport,
            "Accommodation": Accommodation,
        }
        model_cls = type_mapping.get(resource_in.type, Resource)
        
        resource_data = resource_in.model_dump(exclude_unset=True)
        new_resource = model_cls(**resource_data)
        db.add(new_resource)
        db.commit()
        db.refresh(new_resource)
        return new_resource

    @staticmethod
    def list_resources(
        db: Session,
        resource_type: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Resource]:
        """List all resources with optional filtering."""
        query = db.query(Resource)
        if resource_type:
            query = query.filter(Resource.type == resource_type)
        if status_filter:
            query = query.filter(Resource.status == status_filter)
        return query.all()

    @staticmethod
    def get_resource_by_id(db: Session, resource_id: int) -> Resource:
        """Retrieve resource by ID."""
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resource with ID {resource_id} not found."
            )
        return resource

    @staticmethod
    def book_resource(db: Session, user: User, booking_in: BookingCreate) -> Booking:
        """
        Pessimistic Concurrency Booking:
        1. Validates time range (start_time < end_time).
        2. Acquires row-level lock on the target Resource via `.with_for_update()`.
        3. Checks if the resource is currently under maintenance.
        4. Queries the Booking table for any overlapping 'Confirmed' bookings for that resource:
           Overlap condition: (existing.start_time < new_end_time) AND (existing.end_time > new_start_time).
        5. If overlap exists -> aborts transaction with HTTP 409 Conflict.
        6. If clear -> creates the Booking record ('Confirmed') and commits (releasing the lock).
        """
        if booking_in.start_time >= booking_in.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking start_time must be strictly before end_time."
            )

        try:
            # Step 1: Pessimistic Row Lock on target Resource within transaction
            locked_resource = (
                db.query(Resource)
                .filter(Resource.id == booking_in.resource_id)
                .with_for_update()
                .first()
            )

            if not locked_resource:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Resource with ID {booking_in.resource_id} not found."
                )

            if locked_resource.status == "Maintenance":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Resource '{locked_resource.name}' is currently under Maintenance and cannot be booked."
                )

            # Step 2: Check for overlapping confirmed reservations for this resource
            overlapping_booking = (
                db.query(Booking)
                .filter(
                    Booking.resource_id == booking_in.resource_id,
                    Booking.status == "Confirmed",
                    Booking.start_time < booking_in.end_time,
                    Booking.end_time > booking_in.start_time
                )
                .first()
            )

            if overlapping_booking:
                # Abort transaction and raise 409 Conflict
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Concurrency Conflict: Resource '{locked_resource.name}' is already booked from "
                        f"{overlapping_booking.start_time.isoformat()} to {overlapping_booking.end_time.isoformat()}."
                    )
                )

            # Step 3: Create and commit the confirmed booking
            new_booking = Booking(
                user_id=user.id,
                resource_id=locked_resource.id,
                start_time=booking_in.start_time,
                end_time=booking_in.end_time,
                status="Confirmed",
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_booking)
            db.commit()
            db.refresh(new_booking)
            return new_booking

        except HTTPException:
            db.rollback()
            raise
        except Exception as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while booking resource: {str(exc)}"
            )

    @staticmethod
    def cancel_booking(db: Session, booking_id: int, user: User) -> Booking:
        """Cancel an existing booking and mark status as 'Cancelled'."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking with ID {booking_id} not found."
            )

        # Verify authorization (booking owner or elevated role)
        user_roles = {r.role_name for r in user.roles}
        if booking.user_id != user.id and not user_roles.intersection({"Admin", "Faculty Advisor"}):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this booking."
            )

        booking.status = "Cancelled"
        db.commit()
        db.refresh(booking)
        return booking

    @staticmethod
    def report_damage(
        db: Session,
        resource_id: int,
        report_in: DamageReportCreate
    ) -> DamageReport:
        """Create a damage report for a resource."""
        resource = ResourceService.get_resource_by_id(db, resource_id)

        damage_report = DamageReport(
            resource_id=resource.id,
            description=report_in.description,
            image_path=report_in.image_path,
            report_date=datetime.now(timezone.utc),
            estimated_cost=report_in.estimated_cost
        )
        db.add(damage_report)
        db.commit()
        db.refresh(damage_report)
        return damage_report
