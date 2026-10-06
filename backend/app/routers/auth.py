from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.models.user import User
from app.services.auth_service import AuthService
from app.core.security import create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user, creates their profile, assigns default/requested role, and sends a welcome email."
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Endpoint for user registration."""
    new_user = AuthService.register_user(db=db, user_data=user_in)
    return new_user


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Validates credentials, creates an active Session in DB, and returns a signed JWT containing user roles."
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Endpoint for user login with JSON payload."""
    user = AuthService.authenticate_user(db=db, login_data=login_data)
    
    # Create persistent session record in DB
    user_session = AuthService.create_session(db=db, user=user)
    
    # Extract role names
    role_names = [role.role_name for role in user.roles]
    
    # Issue JWT token
    access_token = create_access_token(
        subject=user.id,
        roles=role_names,
        extra_claims={
            "email": user.email,
            "session_id": user_session.session_id,
        }
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        session_id=user_session.session_id,
        user=user
    )


@router.post(
    "/token",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="OAuth2 compatible login (for Swagger UI 'Authorize' button)",
    include_in_schema=True
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 standard form-encoded login endpoint for Swagger UI."""
    login_data = UserLogin(email=form_data.username, password=form_data.password)
    user = AuthService.authenticate_user(db=db, login_data=login_data)
    user_session = AuthService.create_session(db=db, user=user)
    role_names = [role.role_name for role in user.roles]
    access_token = create_access_token(
        subject=user.id,
        roles=role_names,
        extra_claims={
            "email": user.email,
            "session_id": user_session.session_id,
        }
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        session_id=user_session.session_id,
        user=user
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Terminates the user's active session in the database."
)
def logout(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to terminate active session."""
    success = AuthService.invalidate_session(db=db, session_id=session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found or already terminated."
        )
    return {"message": "Successfully logged out. Session invalidated."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Fetches authenticated user profile and roles."
)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently logged-in user."""
    return current_user

