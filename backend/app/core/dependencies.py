from typing import List, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, Session as DbSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to retrieve and validate the authenticated user from the JWT Bearer token.
    Validates token signature, expiration, active user status, and active session status.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str: str = payload.get("sub")
    session_id: str = payload.get("session_id")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    # Query user from DB
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.status:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account."
        )

    # Optional: Verify if current session is still marked active
    if session_id:
        active_session = (
            db.query(DbSession)
            .filter(DbSession.session_id == session_id, DbSession.is_active == True)
            .first()
        )
        if not active_session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has expired or was terminated. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user


def require_role(allowed_roles: Union[str, List[str]]):
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("Admin"))])
        @router.get("/event-approval", dependencies=[Depends(require_role(["Faculty Advisor", "Admin"]))])
    """
    if isinstance(allowed_roles, str):
        roles_set = {allowed_roles}
    else:
        roles_set = set(allowed_roles)

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = {role.role_name for role in current_user.roles}
        
        # Check intersection between user roles and allowed roles
        if not roles_set.intersection(user_role_names):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {list(roles_set)}"
            )
        return current_user

    return role_checker

