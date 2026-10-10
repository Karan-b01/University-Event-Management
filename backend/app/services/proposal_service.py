import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.proposal import (
    EventProposal,
    EventDetails,
    Schedule,
    Document,
    Poster,
    VendorQuotation,
)
from app.schemas.proposal import (
    ProposalDraftCreate,
    ProposalUpdate,
    ProposalExportResponse,
)

UPLOAD_BASE_DIR = os.path.join(os.getcwd(), "uploads")


class ProposalService:
    """
    Business logic and orchestration for Event Proposals, Single Table Inheritance Documents,
    Validation, and Aggregated Export.
    """

    @staticmethod
    def create_draft(db: Session, user: User, draft_in: ProposalDraftCreate) -> EventProposal:
        """
        Saves the initial proposal as Draft with support for partial/nullable data.
        """
        proposal = EventProposal(
            user_id=user.id,
            title=draft_in.title or "Untitled Proposal",
            status="Draft",
            team_data=draft_in.team_data.model_dump() if draft_in.team_data else None,
        )
        db.add(proposal)
        db.flush()  # Generate proposal.id for children

        # Attach EventDetails if provided
        if draft_in.details:
            event_details = EventDetails(
                proposal_id=proposal.id,
                description=draft_in.details.description,
                objective=draft_in.details.objective,
                expected_participants=draft_in.details.expected_participants,
            )
            db.add(event_details)

        # Attach Schedule if provided
        if draft_in.schedule:
            schedule = Schedule(
                proposal_id=proposal.id,
                start_date=draft_in.schedule.start_date,
                end_date=draft_in.schedule.end_date,
                venue_preference=draft_in.schedule.venue_preference,
            )
            db.add(schedule)

        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def get_proposal_by_id(db: Session, proposal_id: str, user: Optional[User] = None) -> EventProposal:
        """Fetch proposal and verify access rights."""
        proposal = db.query(EventProposal).filter(EventProposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proposal with ID '{proposal_id}' not found."
            )
        
        # Verify access: author or elevated roles (Admin, Faculty Advisor, Finance Officer)
        if user:
            user_role_names = {r.role_name for r in user.roles}
            elevated_roles = {"Admin", "Faculty Advisor", "Finance Officer", "Security Officer"}
            if proposal.user_id != user.id and not user_role_names.intersection(elevated_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this proposal."
                )
        return proposal

    @staticmethod
    def update_proposal(
        db: Session, 
        proposal_id: str, 
        user: User, 
        update_in: ProposalUpdate
    ) -> EventProposal:
        """
        Overwrites/updates the existing proposal data without creating a new version row.
        """
        proposal = ProposalService.get_proposal_by_id(db, proposal_id, user)

        # Check if proposal is already submitted/locked
        if proposal.status not in ["Draft", "Pending"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot edit proposal in '{proposal.status}' status."
            )

        # Update title & team_data
        if update_in.title is not None:
            proposal.title = update_in.title
        if update_in.team_data is not None:
            proposal.team_data = update_in.team_data.model_dump()

        # Update or create EventDetails
        if update_in.details is not None:
            if proposal.event_details:
                if update_in.details.description is not None:
                    proposal.event_details.description = update_in.details.description
                if update_in.details.objective is not None:
                    proposal.event_details.objective = update_in.details.objective
                if update_in.details.expected_participants is not None:
                    proposal.event_details.expected_participants = update_in.details.expected_participants
            else:
                proposal.event_details = EventDetails(
                    proposal_id=proposal.id,
                    description=update_in.details.description,
                    objective=update_in.details.objective,
                    expected_participants=update_in.details.expected_participants,
                )

        # Update or create Schedule
        if update_in.schedule is not None:
            if proposal.schedule:
                if update_in.schedule.start_date is not None:
                    proposal.schedule.start_date = update_in.schedule.start_date
                if update_in.schedule.end_date is not None:
                    proposal.schedule.end_date = update_in.schedule.end_date
                if update_in.schedule.venue_preference is not None:
                    proposal.schedule.venue_preference = update_in.schedule.venue_preference
            else:
                proposal.schedule = Schedule(
                    proposal_id=proposal.id,
                    start_date=update_in.schedule.start_date,
                    end_date=update_in.schedule.end_date,
                    venue_preference=update_in.schedule.venue_preference,
                )

        proposal.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def clone_proposal(db: Session, proposal_id: str, user: User) -> EventProposal:
        """Create a new draft from an existing proposal's details, schedule, and team."""
        source = ProposalService.get_proposal_by_id(db, proposal_id, user)
        clone = EventProposal(
            user_id=user.id,
            title=f"{source.title} (Copy)",
            status="Draft",
            team_data=source.team_data,
        )
        db.add(clone)
        db.flush()
        if source.event_details:
            clone.event_details = EventDetails(
                description=source.event_details.description,
                objective=source.event_details.objective,
                expected_participants=source.event_details.expected_participants,
            )
        if source.schedule:
            clone.schedule = Schedule(
                start_date=source.schedule.start_date,
                end_date=source.schedule.end_date,
                venue_preference=source.schedule.venue_preference,
            )
        db.commit()
        db.refresh(clone)
        return clone

    @staticmethod
    def withdraw_proposal(db: Session, proposal_id: str, user: User) -> EventProposal:
        """Withdraw a draft or submitted proposal before an approval workflow begins."""
        proposal = ProposalService.get_proposal_by_id(db, proposal_id, user)
        if proposal.status not in {"Draft", "Submitted"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft or submitted proposals can be withdrawn.",
            )
        proposal.status = "Withdrawn"
        proposal.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def submit_proposal(db: Session, proposal_id: str, user: User) -> EventProposal:
        """
        Validates the proposal and transitions status from 'Draft' to 'Submitted'.
        Requirement:
        - EventDetails must be attached and filled (description, objective, expected_participants).
        - Schedule must be attached and filled (start_date, end_date, venue_preference).
        - At least one Document (Poster or VendorQuotation) must be attached.
        """
        proposal = ProposalService.get_proposal_by_id(db, proposal_id, user)

        validation_errors = []

        # Validate EventDetails
        details = proposal.event_details
        if not details:
            validation_errors.append("Event details are missing.")
        else:
            if not details.description or not details.description.strip():
                validation_errors.append("Event description is required.")
            if not details.objective or not details.objective.strip():
                validation_errors.append("Event objective is required.")
            if not details.expected_participants or details.expected_participants < 1:
                validation_errors.append("Valid expected participants count (> 0) is required.")

        # Validate Schedule
        schedule = proposal.schedule
        if not schedule:
            validation_errors.append("Event schedule is missing.")
        else:
            if not schedule.start_date:
                validation_errors.append("Start date is required.")
            if not schedule.end_date:
                validation_errors.append("End date is required.")
            if schedule.start_date and schedule.end_date and schedule.start_date >= schedule.end_date:
                validation_errors.append("End date must be after start date.")
            if not schedule.venue_preference or not schedule.venue_preference.strip():
                validation_errors.append("Venue preference is required.")

        # Validate Documents
        if not proposal.documents or len(proposal.documents) == 0:
            validation_errors.append("At least one supporting document (Poster or Vendor Quotation) must be uploaded.")

        requested_budget = (proposal.team_data or {}).get("requested_budget")
        try:
            has_requested_budget = float(requested_budget) > 0
        except (TypeError, ValueError):
            has_requested_budget = False
        if not has_requested_budget:
            validation_errors.append("A requested event budget greater than zero is required.")

        if validation_errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Proposal submission validation failed.",
                    "errors": validation_errors
                }
            )

        # Transition status
        proposal.status = "Submitted"
        proposal.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def upload_document(
        db: Session,
        proposal_id: str,
        user: User,
        file: UploadFile,
        doc_type: str = "Poster"
    ) -> Document:
        """
        Saves the uploaded file to local /uploads directory and creates
        a polymorphic Document record (Poster or VendorQuotation).
        """
        proposal = ProposalService.get_proposal_by_id(db, proposal_id, user)

        # Validate polymorphic type
        valid_types = {"Poster": Poster, "VendorQuotation": VendorQuotation}
        model_class = valid_types.get(doc_type)
        if not model_class:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document type '{doc_type}'. Allowed types: {list(valid_types.keys())}"
            )

        # Ensure upload directory exists
        proposal_dir = os.path.join(UPLOAD_BASE_DIR, proposal.id)
        os.makedirs(proposal_dir, exist_ok=True)

        # Generate unique file path
        file_ext = os.path.splitext(file.filename)[1]
        unique_file_name = f"{uuid.uuid4().hex}_{file.filename}"
        saved_file_path = os.path.join(proposal_dir, unique_file_name)

        # Save to disk
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create polymorphic DB document record
        document = model_class(
            proposal_id=proposal.id,
            file_name=file.filename,
            file_path=saved_file_path,
            type=doc_type
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def export_proposal(db: Session, proposal_id: str, user: User) -> ProposalExportResponse:
        """
        Simulates the UML ExportManager: generates a fully aggregated, structured
        JSON export containing all proposal details, schedule, team roster, and document metadata.
        """
        proposal = ProposalService.get_proposal_by_id(db, proposal_id, user)

        details_dict = None
        if proposal.event_details:
            details_dict = {
                "description": proposal.event_details.description,
                "objective": proposal.event_details.objective,
                "expected_participants": proposal.event_details.expected_participants,
            }

        schedule_dict = None
        if proposal.schedule:
            schedule_dict = {
                "start_date": proposal.schedule.start_date.isoformat() if proposal.schedule.start_date else None,
                "end_date": proposal.schedule.end_date.isoformat() if proposal.schedule.end_date else None,
                "venue_preference": proposal.schedule.venue_preference,
            }

        documents_list = [
            {
                "id": doc.id,
                "type": doc.type,
                "file_name": doc.file_name,
                "file_path": doc.file_path,
                "upload_date": doc.upload_date.isoformat(),
            }
            for doc in proposal.documents
        ]

        organizer_info = {
            "id": proposal.user.id if proposal.user else proposal.user_id,
            "name": proposal.user.name if proposal.user else "Unknown",
            "email": proposal.user.email if proposal.user else "Unknown",
        }

        return ProposalExportResponse(
            proposal_id=proposal.id,
            title=proposal.title,
            status=proposal.status,
            organizer=organizer_info,
            details=details_dict,
            schedule=schedule_dict,
            organizing_team=proposal.team_data,
            attached_documents=documents_list,
            created_at=proposal.created_at,
            updated_at=proposal.updated_at,
            exported_at=datetime.now(timezone.utc),
        )

