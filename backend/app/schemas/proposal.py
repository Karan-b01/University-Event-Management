from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# Organizing Team Schemas
# ==========================================

class TeamMember(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the team member")
    role: str = Field(..., min_length=1, description="Role/Designation in the event organizing team")


class OrganizingTeam(BaseModel):
    team_name: Optional[str] = Field(None, description="Name of the organizing committee/club")
    members: List[TeamMember] = Field(default_factory=list, description="List of team members and their roles")


# ==========================================
# Event Details Schemas
# ==========================================

class EventDetailsBase(BaseModel):
    description: Optional[str] = Field(None, description="Detailed description of the event")
    objective: Optional[str] = Field(None, description="Core objective / expected outcomes of the event")
    expected_participants: Optional[int] = Field(None, ge=1, description="Estimated number of participants")


class EventDetailsCreate(EventDetailsBase):
    pass


class EventDetailsUpdate(EventDetailsBase):
    pass


class EventDetailsResponse(EventDetailsBase):
    proposal_id: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Schedule Schemas
# ==========================================

class ScheduleBase(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Event start date and time")
    end_date: Optional[datetime] = Field(None, description="Event end date and time")
    venue_preference: Optional[str] = Field(None, description="Preferred campus venue / hall / auditorium")


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(ScheduleBase):
    pass


class ScheduleResponse(ScheduleBase):
    proposal_id: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Document Schemas (Single Table Inheritance)
# ==========================================

class DocumentBase(BaseModel):
    file_name: str
    file_path: str
    type: str = Field(..., description="Document type: 'Poster' or 'VendorQuotation'")


class DocumentResponse(DocumentBase):
    id: int
    proposal_id: str
    upload_date: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Proposal Request & Response Schemas
# ==========================================

class ProposalDraftCreate(BaseModel):
    """Allows partial data and nullable fields for saving progress as Draft."""
    title: Optional[str] = Field(default="Untitled Proposal", min_length=1, max_length=255)
    details: Optional[EventDetailsBase] = None
    schedule: Optional[ScheduleBase] = None
    team_data: Optional[OrganizingTeam] = None


class ProposalCreate(BaseModel):
    """Schema for submitting or creating full proposal."""
    title: str = Field(..., min_length=3, max_length=255)
    details: Optional[EventDetailsBase] = None
    schedule: Optional[ScheduleBase] = None
    team_data: Optional[OrganizingTeam] = None


class ProposalUpdate(BaseModel):
    """Schema for updating existing proposal fields."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    details: Optional[EventDetailsBase] = None
    schedule: Optional[ScheduleBase] = None
    team_data: Optional[OrganizingTeam] = None


class ProposalResponse(BaseModel):
    """Standard comprehensive proposal response."""
    id: str
    user_id: int
    title: str
    status: str
    team_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    event_details: Optional[EventDetailsResponse] = None
    schedule: Optional[ScheduleResponse] = None
    documents: List[DocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProposalExportResponse(BaseModel):
    """Simulates the ExportManager aggregated structured JSON export."""
    proposal_id: str
    title: str
    status: str
    organizer: Dict[str, Any]
    details: Optional[Dict[str, Any]] = None
    schedule: Optional[Dict[str, Any]] = None
    organizing_team: Optional[Dict[str, Any]] = None
    attached_documents: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime
    exported_at: datetime = Field(default_factory=datetime.utcnow)

