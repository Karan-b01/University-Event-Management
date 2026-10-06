from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.proposal import EventProposal
from app.models.approval import (
    ApprovalWorkflow,
    ApprovalNode,
    ApprovalHistory,
    RiskAssessment,
)
from app.schemas.approval import ReviewRequest
from app.services.compliance_validator import ComplianceValidatorService


class ApprovalService:
    """
    Workflow engine managing dynamic node generation, compliance validation,
    multi-tier role authorization, and audit logging.
    """

    @staticmethod
    def initiate_workflow(db: Session, proposal_id: str, user: User) -> ApprovalWorkflow:
        """
        Initiates the dynamic approval workflow:
        1. Validates Proposal existence.
        2. Executes ComplianceValidatorService automated pre-screening.
        3. Creates ApprovalWorkflow & RiskAssessment record.
        4. Dynamically determines and creates approval tier nodes based on risk assessment:
           - Step 1: Faculty Advisor (Standard)
           - Step 2 (Conditional on High Risk): Security Officer
           - Step 3: Finance Officer (Financial Clearance)
           - Step 4: Admin (Final Sanction)
        5. Logs initial action to ApprovalHistory (Audit Trail).
        """
        proposal = db.query(EventProposal).filter(EventProposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event proposal with ID '{proposal_id}' not found."
            )

        # Check existing active workflow
        existing_workflow = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.proposal_id == proposal_id).first()
        if existing_workflow and existing_workflow.status in ["In Progress", "Approved"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An active approval workflow already exists for proposal '{proposal_id}'."
            )

        # Execute automated pre-screening compliance check
        eval_result = ComplianceValidatorService.evaluate(db, proposal)

        # Create or update Workflow
        if existing_workflow:
            workflow = existing_workflow
            workflow.status = "In Progress"
            workflow.current_step = 1
            workflow.updated_at = datetime.now(timezone.utc)
            # Clear previous nodes and risk assessment
            db.query(ApprovalNode).filter(ApprovalNode.workflow_id == workflow.id).delete()
            db.query(RiskAssessment).filter(RiskAssessment.workflow_id == workflow.id).delete()
        else:
            workflow = ApprovalWorkflow(
                proposal_id=proposal_id,
                status="In Progress",
                current_step=1,
            )
            db.add(workflow)
            db.flush()

        # Attach RiskAssessment
        risk_record = RiskAssessment(
            workflow_id=workflow.id,
            risk_score=eval_result["risk_score"],
            is_high_risk=eval_result["is_high_risk"],
            flag_details=eval_result["flag_details"]
        )
        db.add(risk_record)

        # Generate Dynamic Approval Nodes
        step = 1
        # Tier 1: Faculty Advisor
        db.add(ApprovalNode(
            workflow_id=workflow.id,
            step_number=step,
            required_role="Faculty Advisor",
            status="Pending"
        ))
        step += 1

        # Tier 2: Security Officer (Dynamically added if high-risk or large crowd)
        if eval_result["is_high_risk"]:
            db.add(ApprovalNode(
                workflow_id=workflow.id,
                step_number=step,
                required_role="Security Officer",
                status="Pending"
            ))
            step += 1

        # Tier 3: Finance Officer
        db.add(ApprovalNode(
            workflow_id=workflow.id,
            step_number=step,
            required_role="Finance Officer",
            status="Pending"
        ))
        step += 1

        # Tier 4: Admin (Final Authority)
        db.add(ApprovalNode(
            workflow_id=workflow.id,
            step_number=step,
            required_role="Admin",
            status="Pending"
        ))

        # Add Audit History Record
        history_entry = ApprovalHistory(
            workflow_id=workflow.id,
            reviewer_id=user.id,
            action_taken="Initiated",
            remarks=(
                f"Workflow initiated. Automated compliance check completed with Risk Score {eval_result['risk_score']} "
                f"(High Risk: {eval_result['is_high_risk']})."
            ),
            timestamp=datetime.now(timezone.utc)
        )
        db.add(history_entry)

        # Update proposal status
        proposal.status = "Pending Approval"

        db.commit()
        db.refresh(workflow)
        return workflow

    @staticmethod
    def get_workflow_by_proposal_id(db: Session, proposal_id: str) -> ApprovalWorkflow:
        """Retrieve full approval workflow, active nodes, and audit history."""
        workflow = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.proposal_id == proposal_id).first()
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval workflow for proposal '{proposal_id}' not found."
            )
        return workflow

    @staticmethod
    def review_node(
        db: Session,
        node_id: int,
        review_req: ReviewRequest,
        current_user: User
    ) -> ApprovalWorkflow:
        """
        Human Review Execution:
        1. Verifies that current_user possesses the required_role for this node.
        2. Ensures node is currently active (step_number == workflow.current_step).
        3. Updates node status ('Approved' or 'Rejected').
        4. Logs review decision to immutable ApprovalHistory.
        5. Routing:
           - If Approved: Advances workflow.current_step. If final node, marks workflow and proposal as 'Approved'.
           - If Rejected: Immediately marks workflow and proposal as 'Rejected' and halts routing.
        """
        node = db.query(ApprovalNode).filter(ApprovalNode.id == node_id).first()
        if not node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval node with ID {node_id} not found."
            )

        workflow = node.workflow

        # Ensure node is part of an active workflow
        if workflow.status not in ["Initiated", "In Progress"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Workflow is already finalized with status '{workflow.status}'."
            )

        # Ensure review is in sequential order
        if node.step_number != workflow.current_step:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Node step {node.step_number} is not the current active step ({workflow.current_step})."
            )

        # RBAC Check: User must hold the required role for this specific node (or Admin)
        user_roles = {r.role_name for r in current_user.roles}
        if node.required_role not in user_roles and "Admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: You do not possess the required role '{node.required_role}' to review this node."
            )

        # Validate decision value
        decision = review_req.decision.capitalize()
        if decision not in ["Approved", "Rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid decision. Must be 'Approved' or 'Rejected'."
            )

        # Update node
        node.status = decision
        node.reviewer_id = current_user.id
        node.reviewed_at = datetime.now(timezone.utc)

        # Append immutable audit trail
        history_entry = ApprovalHistory(
            workflow_id=workflow.id,
            reviewer_id=current_user.id,
            action_taken=decision,
            remarks=review_req.remarks or f"Reviewed by {current_user.name} ({node.required_role})",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(history_entry)

        # Multi-Tier Routing Logic
        proposal = workflow.proposal
        if decision == "Rejected":
            workflow.status = "Rejected"
            if proposal:
                proposal.status = "Rejected"
        else:
            # Check if there are subsequent nodes in the workflow
            max_step = max(n.step_number for n in workflow.nodes)
            if workflow.current_step < max_step:
                workflow.current_step += 1
            else:
                # Final step approved -> Full Approval Sanctioned
                workflow.status = "Approved"
                if proposal:
                    proposal.status = "Approved"

        workflow.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(workflow)
        return workflow
