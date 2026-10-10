from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models.user import User
from app.schemas.approval import (
    InboxItemResponse,
    WorkflowResponse,
    ReviewRequest,
)
from app.schemas.proposal import ProposalResponse
from app.models.proposal import EventProposal
from app.models.approval import ApprovalWorkflow, ApprovalNode
from app.schemas.finance import BudgetResponse
from app.services.approval_service import ApprovalService
from app.core.dependencies import get_current_user, require_role

router = APIRouter(
    prefix="/approvals",
    tags=["Module 5: Approval and Compliance Engine"]
)


@router.get(
    "/inbox",
    response_model=list[InboxItemResponse],
    summary="List proposals awaiting or already reviewed by the current user's approval roles",
)
def list_approval_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roles = {role.role_name for role in current_user.roles}
    if not roles:
        return []

    # If Admin, show all proposals with an approval workflow
    if "Admin" in roles:
        matching_proposal_ids = (
            db.query(ApprovalWorkflow.proposal_id)
            .distinct()
        )
    else:
        # Match proposals where:
        # 1. Active step is currently pending for user's role
        # 2. User explicitly reviewed a node in the workflow
        # 3. User's role has completed their tier in the workflow
        matching_proposal_ids = (
            db.query(ApprovalWorkflow.proposal_id)
            .join(ApprovalNode, ApprovalNode.workflow_id == ApprovalWorkflow.id)
            .filter(
                or_(
                    and_(
                        ApprovalWorkflow.status.in_(["Initiated", "In Progress"]),
                        ApprovalNode.status == "Pending",
                        ApprovalNode.step_number == ApprovalWorkflow.current_step,
                        ApprovalNode.required_role.in_(roles),
                    ),
                    ApprovalNode.reviewer_id == current_user.id,
                    and_(
                        ApprovalNode.required_role.in_(roles),
                        ApprovalNode.status.in_(["Approved", "Rejected"]),
                    ),
                )
            )
            .distinct()
        )

    proposals = (
        db.query(EventProposal)
        .filter(EventProposal.id.in_(matching_proposal_ids))
        .order_by(EventProposal.created_at.desc())
        .all()
    )

    results = []
    for p in proposals:
        p_dict = ProposalResponse.model_validate(p).model_dump()
        wf = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.proposal_id == p.id).first()
        if wf:
            p_dict["workflow_status"] = wf.status
            p_dict["active_step"] = wf.current_step
            active_node = next(
                (n for n in wf.nodes if n.step_number == wf.current_step and n.status == "Pending"),
                None
            )
            p_dict["current_step_role"] = (
                active_node.required_role if active_node else ("Completed" if wf.status == "Approved" else None)
            )

            # Check if user or user's role made a decision
            user_node = next(
                (n for n in wf.nodes if n.reviewer_id == current_user.id or (n.required_role in roles and n.status in ["Approved", "Rejected"])),
                None
            )
            if user_node:
                p_dict["user_decision"] = user_node.status

            p_dict["is_action_required"] = bool(
                active_node and (active_node.required_role in roles or "Admin" in roles)
            )
        results.append(InboxItemResponse(**p_dict))

    return results


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


@router.post(
    "/{proposal_id}/budget/approve",
    response_model=BudgetResponse,
    dependencies=[Depends(require_role(["Faculty Advisor", "Admin"]))],
    summary="Approve a proposal's requested budget before proposal review",
)
def approve_requested_budget(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ApprovalService.approve_budget_request(db, proposal_id, current_user)


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

