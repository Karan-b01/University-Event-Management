from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Role
from app.schemas.user import UserResponse, RoleResponse
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Users & Role-Based Access Control"])


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="List all users",
    dependencies=[Depends(require_role(["Admin", "Faculty Advisor"]))]
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve users list. Requires Admin or Faculty Advisor role."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get(
    "/roles",
    response_model=List[RoleResponse],
    summary="List all available roles in the system"
)
def list_roles(db: Session = Depends(get_db)):
    """Public/Authenticated listing of defined system roles."""
    roles = db.query(Role).all()
    return roles


@router.get(
    "/student-organizer-area",
    summary="Student Organizer Workspace",
    dependencies=[Depends(require_role(["Student Organizer", "Admin"]))]
)
def student_organizer_area(current_user: User = Depends(get_current_user)):
    """RBAC Protected endpoint accessible only by 'Student Organizer' or 'Admin'."""
    return {
        "message": f"Welcome to the Student Organizer dashboard, {current_user.name}!",
        "access_level": "Student Organizer / Admin",
        "roles": [r.role_name for r in current_user.roles]
    }


@router.get(
    "/faculty-advisor-area",
    summary="Faculty Advisor Review Board",
    dependencies=[Depends(require_role(["Faculty Advisor", "Admin"]))]
)
def faculty_advisor_area(current_user: User = Depends(get_current_user)):
    """RBAC Protected endpoint accessible only by 'Faculty Advisor' or 'Admin'."""
    return {
        "message": f"Welcome to the Faculty Advisor portal, {current_user.name}!",
        "access_level": "Faculty Advisor / Admin",
        "roles": [r.role_name for r in current_user.roles]
    }


@router.get(
    "/finance-officer-area",
    summary="Finance Officer Budget Clearance",
    dependencies=[Depends(require_role(["Finance Officer", "Admin"]))]
)
def finance_officer_area(current_user: User = Depends(get_current_user)):
    """RBAC Protected endpoint accessible only by 'Finance Officer' or 'Admin'."""
    return {
        "message": f"Welcome to the Finance Officer dashboard, {current_user.name}!",
        "access_level": "Finance Officer / Admin",
        "roles": [r.role_name for r in current_user.roles]
    }


@router.get(
    "/admin-area",
    summary="System Administrator Control Panel",
    dependencies=[Depends(require_role("Admin"))]
)
def admin_area(current_user: User = Depends(get_current_user)):
    """RBAC Protected endpoint accessible strictly by 'Admin'."""
    return {
        "message": f"Welcome to the Administrator Master Panel, {current_user.name}!",
        "access_level": "Admin",
        "roles": [r.role_name for r in current_user.roles]
    }

