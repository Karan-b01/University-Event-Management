from .auth import router as auth_router
from .users import router as users_router
from .proposals import router as proposals_router
from .resources import router as resources_router
from .finance import router as finance_router

__all__ = [
    "auth_router",
    "users_router",
    "proposals_router",
    "resources_router",
    "finance_router",
]
