import datetime as dt
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# Review Request Schema
# ==========================================

class ReviewRequest(BaseModel):
    decision: str = Field(..., description="Decision choice: 'Approved' or 'Rejected'")
    remarks: Optional[str] = Field(None, description="Detailed review feedback or conditions for approval/rejection")


# ==========================================
# Approval Node & History Schemas
# ==========================================

class NodeResponse(BaseModel):
    id: int
    workflow_id: int
    step_number: int
    required_role: str
    status: str
    reviewer_id: Optional[int] = None
    reviewed_at: Optional[dt.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class HistoryResponse(BaseModel):
    id: int
    workflow_id: int
    reviewer_id: Optional[int] = None
    action_taken: str
    remarks: Optional[str] = None
    timestamp: dt.datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Risk Assessment Schemas
# ==========================================

class RiskAssessmentResponse(BaseModel):
    id: int
    workflow_id: int
    risk_score: int
    is_high_risk: bool
    flag_details: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Workflow Response Schema
# ==========================================

class WorkflowResponse(BaseModel):
    id: int
    proposal_id: str
    status: str
    current_step: int
    created_at: dt.datetime
    updated_at: dt.datetime
    risk_assessment: Optional[RiskAssessmentResponse] = None
    nodes: List[NodeResponse] = []
    history: List[HistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

