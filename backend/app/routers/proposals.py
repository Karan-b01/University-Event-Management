from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    status,
    UploadFile,
    File,
    Form,
    HTTPException,
)
from fastapi.responses import FileResponse
import os
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.proposal import EventProposal
from app.schemas.proposal import (
    ProposalDraftCreate,
    ProposalUpdate,
    ProposalResponse,
    DocumentResponse,
    ProposalExportResponse,
)
from app.services.proposal_service import ProposalService
from app.services.approval_service import ApprovalService
from app.core.dependencies import get_current_user, require_role
from app.core.document_access import can_view_document
from app.models.proposal import Document

router = APIRouter(
    prefix="/proposals",
    tags=["Module 2: Event Proposal Management"]
)



@router.post(
    "/draft",
    response_model=ProposalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save initial proposal draft",
    description="Creates an initial event proposal draft. Allows partial/nullable data so users can save their progress.",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def create_proposal_draft(
    draft_in: ProposalDraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to save initial proposal draft."""
    proposal = ProposalService.create_draft(db=db, user=current_user, draft_in=draft_in)
    return proposal


@router.put(
    "/{proposal_id}",
    response_model=ProposalResponse,
    status_code=status.HTTP_200_OK,
    summary="Update existing proposal",
    description="Overwrites/updates the existing proposal data directly without creating a new version row.",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def update_proposal(
    proposal_id: str,
    update_in: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to update/overwrite existing proposal draft."""
    proposal = ProposalService.update_proposal(
        db=db,
        proposal_id=proposal_id,
        user=current_user,
        update_in=update_in
    )
    return proposal


@router.post(
    "/{proposal_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload proposal document",
    description="Uploads a supporting document (Poster or VendorQuotation) and stores it using Single Table Inheritance.",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def upload_proposal_document(
    proposal_id: str,
    file: UploadFile = File(..., description="The document file to upload"),
    doc_type: str = Form("Poster", description="Document type: 'Poster' or 'VendorQuotation'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint for uploading documents linked to an event proposal."""
    document = ProposalService.upload_document(
        db=db,
        proposal_id=proposal_id,
        user=current_user,
        file=file,
        doc_type=doc_type
    )
    return document


@router.post(
    "/{proposal_id}/submit",
    response_model=ProposalResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit proposal for compliance review",
    description="Validates completeness (EventDetails, Schedule, and at least one Document required) and transitions status to 'Submitted'.",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def submit_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to validate and submit a proposal."""
    proposal = ProposalService.submit_proposal(
        db=db,
        proposal_id=proposal_id,
        user=current_user
    )
    ApprovalService.initiate_workflow(db, proposal_id=proposal.id, user=current_user)
    return proposal


@router.post(
    "/{proposal_id}/clone",
    response_model=ProposalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Clone a proposal into a new draft",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def clone_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProposalService.clone_proposal(db, proposal_id, current_user)


@router.post(
    "/{proposal_id}/withdraw",
    response_model=ProposalResponse,
    status_code=status.HTTP_200_OK,
    summary="Withdraw a draft or submitted proposal",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def withdraw_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProposalService.withdraw_proposal(db, proposal_id, current_user)


@router.get(
    "/{proposal_id}/export",
    response_model=ProposalExportResponse,
    status_code=status.HTTP_200_OK,
    summary="Export aggregated proposal (ExportManager simulation)",
    description="Returns fully aggregated proposal details, schedule, team roster, and document metadata as structured JSON."
)
def export_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint simulating the UML ExportManager."""
    export_data = ProposalService.export_proposal(
        db=db,
        proposal_id=proposal_id,
        user=current_user
    )
    return export_data


@router.get(
    "/{proposal_id}",
    response_model=ProposalResponse,
    status_code=status.HTTP_200_OK,
    summary="Get proposal by ID"
)
def get_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve single proposal by ID."""
    proposal = ProposalService.get_proposal_by_id(db=db, proposal_id=proposal_id, user=current_user)
    return proposal


@router.get(
    "/{proposal_id}/documents/{document_id}/download",
    response_class=FileResponse,
    summary="Download a proposal document allowed for the current user",
)
def download_proposal_document(
    proposal_id: str,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.proposal_id == proposal_id,
    ).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal document not found.")
    if not can_view_document(current_user, document):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view this document.")
    if not os.path.isfile(document.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file is unavailable.")
    return FileResponse(document.file_path, filename=document.file_name)


@router.get(
    "/",
    response_model=List[ProposalResponse],
    status_code=status.HTTP_200_OK,
    summary="List proposals for current user"
)
def list_my_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all proposals created by the current user (or all if admin)."""
    user_role_names = {r.role_name for r in current_user.roles}
    elevated_roles = {"Admin", "Faculty Advisor", "Finance Officer", "Security Officer"}
    if user_role_names.intersection(elevated_roles):
        return db.query(EventProposal).all()
    return db.query(EventProposal).filter(EventProposal.user_id == current_user.id).all()

