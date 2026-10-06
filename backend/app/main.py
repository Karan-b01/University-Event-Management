from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import Role
from app.routers import auth_router, users_router, proposals_router, resources_router


def init_db_roles():
    """Seed initial default roles if they do not exist."""
    default_roles = [
        ("Student", "Standard student user for viewing and participating in events"),
        ("Student Organizer", "Student coordinator responsible for organizing university events"),
        ("Faculty Advisor", "Faculty member responsible for reviewing and approving event proposals"),
        ("Finance Officer", "Finance staff reviewing event budgets and fund compliance"),
        ("Admin", "System administrator with full access to manage roles, users, and compliance rules")
    ]
    db = SessionLocal()
    try:
        for role_name, description in default_roles:
            role = db.query(Role).filter(Role.role_name == role_name).first()
            if not role:
                new_role = Role(role_name=role_name, description=description)
                db.add(new_role)
        db.commit()
    except Exception as e:
        print(f"[Startup Warning] Could not auto-seed roles: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager:
    - Creates database tables if they do not exist.
    - Seeds core system roles on startup.
    """
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        # Seed standard roles
        init_db_roles()
        print("[Startup] Database tables and initial roles initialized.")
    except Exception as exc:
        print(f"[Startup Notice] Database initialization skipped or deferred: {exc}")
    yield
    print("[Shutdown] Application shutting down.")


# Initialize FastAPI Application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the University Event Management and Compliance System (OOAD Architecture).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API Routers under standard prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(proposals_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    """Health check and service status endpoint."""
    return {
        "status": "online",
        "system": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }

