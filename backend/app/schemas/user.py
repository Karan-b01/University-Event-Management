from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==========================================
# Role Schemas
# ==========================================

class RoleBase(BaseModel):
    role_name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleResponse(RoleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# UserProfile Schemas
# ==========================================

class UserProfileBase(BaseModel):
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# User Schemas
# ==========================================

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plaintext password to be hashed")
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    role_name: Optional[str] = Field(
        default="Student", 
        description="Role requested at registration: 'Student', 'Student Organizer', 'Faculty Advisor', 'Finance Officer'"
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    captcha_token: Optional[str] = Field(None, description="Optional CAPTCHA token for verification")


class UserResponse(UserBase):
    id: int
    status: bool
    created_at: datetime
    roles: List[RoleResponse] = []
    profile: Optional[UserProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Session & Token Schemas
# ==========================================

class SessionResponse(BaseModel):
    session_id: str
    user_id: int
    login_time: datetime
    logout_time: Optional[datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    session_id: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = []
    session_id: Optional[str] = None

