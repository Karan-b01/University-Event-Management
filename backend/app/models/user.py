import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    """Helper to return current UTC datetime."""
    return datetime.now(timezone.utc)


# Association table for Many-to-Many relationship between User and Role
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Role(Base):
    """
    Role Model representing access permissions in the system.
    Examples: 'Student Organizer', 'Faculty Advisor', 'Finance Officer', 'Admin', 'Student'
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    # Many-to-Many relationship back to users
    users = relationship("User", secondary=user_roles, back_populates="roles")

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, role_name='{self.role_name}')>"


class User(Base):
    """
    User Model representing system accounts.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Stores bcrypt hash
    status = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="joined")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="joined")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', status={self.status})>"


class UserProfile(Base):
    """
    UserProfile Model containing extended profile information (1-to-1 with User).
    """
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # 1-to-1 relationship with User
    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, phone='{self.phone}')>"


class Session(Base):
    """
    Session Model tracking user login sessions for auditing and token revocation.
    """
    __tablename__ = "sessions"

    session_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    login_time = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    logout_time = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationship to User
    user = relationship("User", back_populates="sessions")

    def __repr__(self) -> str:
        return f"<Session(session_id='{self.session_id}', user_id={self.user_id}, is_active={self.is_active})>"

