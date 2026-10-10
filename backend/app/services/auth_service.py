import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, Role, UserProfile, Session as DbSession
from app.schemas.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.gateways import email_gateway, captcha_service


class AuthService:
    """
    Handles user authentication, account registration, role assignment,
    and session tracking.
    """

    @staticmethod
    def get_or_create_role(db: Session, role_name: str, description: Optional[str] = None) -> Role:
        """Fetch an existing role or create it if not present."""
        role = db.query(Role).filter(Role.role_name == role_name).first()
        if not role:
            role = Role(
                role_name=role_name,
                description=description or f"{role_name} system role"
            )
            db.add(role)
            db.commit()
            db.refresh(role)
        return role

    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Register a new user account:
        1. Validate uniqueness of email.
        2. Hash plain password.
        3. Create User & associated UserProfile (1-to-1).
        4. Assign default/requested role.
        5. Trigger external EmailGateway notification.
        """
        # Check email duplicate
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Create User entity
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            status=True,
        )

        # Public registration may only create organizer accounts. Privileged
        # roles must be assigned by an administrator after registration.
        requested_role = user_data.role_name or "Student Organizer"
        if requested_role not in {"Student", "Student Organizer"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Privileged roles can only be assigned by an administrator.",
            )

        # Attach requested Role
        role_to_assign = AuthService.get_or_create_role(
            db, 
            role_name=requested_role
        )
        new_user.roles.append(role_to_assign)

        # Create Profile entity
        new_profile = UserProfile(
            phone=user_data.phone,
            address=user_data.address
        )
        new_user.profile = new_profile

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Trigger Email Gateway (Mock)
        email_gateway.send_welcome_email(recipient=new_user.email, user_name=new_user.name)

        return new_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> User:
        """
        Authenticate user credentials and verify captcha if provided.
        """
        # Verify CAPTCHA
        if login_data.captcha_token:
            is_captcha_valid = captcha_service.verify(login_data.captcha_token)
            if not is_captcha_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CAPTCHA verification failed."
                )

        user = db.query(User).filter(User.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.status:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated."
            )

        return user

    @staticmethod
    def create_session(db: Session, user: User) -> DbSession:
        """Create and persist an active user session."""
        session_id = str(uuid.uuid4())
        new_session = DbSession(
            session_id=session_id,
            user_id=user.id,
            is_active=True,
            login_time=datetime.now(timezone.utc)
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

    @staticmethod
    def invalidate_session(db: Session, session_id: str) -> bool:
        """Mark a session as terminated upon logout."""
        db_session = db.query(DbSession).filter(DbSession.session_id == session_id).first()
        if db_session and db_session.is_active:
            db_session.is_active = False
            db_session.logout_time = datetime.now(timezone.utc)
            db.commit()
            return True
        return False

