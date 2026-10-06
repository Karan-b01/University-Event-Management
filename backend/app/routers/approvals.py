from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.approval import (
    WorkflowResponse,
    ReviewRequest,
)
from app.services.approval_service import ApprovalService
from app.core.dependencies import get_current_user, require_role

router = APIRouter(
    prefix="/approvals",
    tags=["Module 5: Approval and Compliance Engine"]
)


@router.post(
    "/initiate/{proposal_id}",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate event approval workflow",
    description=(
        "Kicks off the automated compliance validation pre-screening (venue capacity, safety protocols) "
        "and dynamically routes multi-tier approval nodes based on calculated risk."
    ),
    dependencies=[Depends(require_role(["Student Organizer", "Faculty Advisor", "Admin"]))]
)
def initiate_approval_workflow(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to initiate approval workflow."""
    return ApprovalService.initiate_workflow(db, proposal_id=proposal_id, user=current_user)


@router.get(
    "/{proposal_id}",
    response_model=WorkflowResponse,
    status_code=status.HTTP_200_OK,
    summary="Get workflow status and audit trail",
    description="Retrieves current active approval step, risk assessment flags, and full immutable audit history."
)
def get_workflow_status(
    proposal_id: str,
    db: Session = Depends(get_db)
):
    """Endpoint to fetch workflow status."""
    return ApprovalService.get_workflow_by_proposal_id(db, proposal_id=proposal_id)


@router.post(
    "/nodes/{node_id}/review",
    response_model=WorkflowResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit human approval review decision",
    description=(
        "Executes human review for a specific workflow node. Validates that the reviewer "
        "possesses the node's required_role, logs remarks into the immutable ApprovalHistory audit trail, "
        "and advances workflow routing to the next tier or finalizes proposal status."
    )
)
def review_node(
    node_id: int,
    review_req: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint for role-authorized reviewers to approve or reject a workflow step."""
    return ApprovalService.review_node(
        db=db,
        node_id=node_id,
        review_req=review_req,
        current_user=current_user
    )

