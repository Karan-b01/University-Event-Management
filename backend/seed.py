"""
Database Seeding Script for University Event Management and Compliance System.
Populates master catalog data, venues, equipment, clubs, categories, test RBAC accounts,
and prototype proposals for end-to-end testing.

Usage:
    python seed.py
    python seed.py --clean
"""

import sys
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path so app modules import cleanly
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Compatibility shim for bcrypt >= 4.1.0 with passlib
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (), {"__version__": getattr(bcrypt, "__version__", "5.0.0")})
_orig_hashpw = bcrypt.hashpw
def _safe_hashpw(password, salt):
    if isinstance(password, bytes) and len(password) > 72:
        password = password[:72]
    return _orig_hashpw(password, salt)
bcrypt.hashpw = _safe_hashpw

from app.database import engine, SessionLocal, Base
from app.core.security import pwd_context
from app.models.user import User, Role, UserProfile, user_roles
from app.models.resource import Resource, Venue, Equipment
from app.models.proposal import EventProposal, EventDetails, Schedule, Document, Poster
from app.models.finance import Budget, Vendor
from app.models.approval import ApprovalWorkflow, ApprovalNode, RiskAssessment


# ==========================================
# MASTER DATA CONSTANTS
# ==========================================

CATEGORIES = [
    "Hackathon",
    "Guest Lecture",
    "Cultural Festival",
    "Technical Workshop",
    "Alumni Meet",
    "Sports Tournament",
    "Blood donation camp",
]

CLUBS = [
    "Systema",
    "GDG Tech",
    "IEEE Women in Engineering",
    "Computer Society of India",
    "Cultural Board",
]

SYSTEM_ROLES = [
    ("Student", "Standard student user for viewing and participating in events"),
    ("Student Organizer", "Student coordinator responsible for organizing university events"),
    ("Faculty Advisor", "Faculty member responsible for reviewing and approving event proposals"),
    ("Security Officer", "Campus security coordinator for crowd control, fire safety, and overnight clearances"),
    ("Finance Officer", "Finance staff reviewing event budgets and fund compliance"),
    ("Admin", "System administrator with full access to manage roles, users, and compliance rules"),
]

TEST_USERS = [
    {
        "name": "Prakhar Sethi",
        "email": "prakhar.sethi@vit.edu",
        "role": "Student Organizer",
        "phone": "+91 98765 43210",
        "address": "VIT Men's Hostel Block D, Room 412",
    },
    {
        "name": "Dr. Sarah Jenkins",
        "email": "advisor@vit.edu",
        "role": "Faculty Advisor",
        "phone": "+91 98765 43211",
        "address": "Faculty Quarters, Academic Block 1",
    },
    {
        "name": "Col. Rajesh Sharma",
        "email": "security@vit.edu",
        "role": "Security Officer",
        "phone": "+91 98765 43212",
        "address": "Campus Security Directorate HQ",
    },
    {
        "name": "CA David Raman",
        "email": "finance@vit.edu",
        "role": "Finance Officer",
        "phone": "+91 98765 43213",
        "address": "University Finance & Comptroller Office",
    },
    {
        "name": "System Administrator",
        "email": "admin@vit.edu",
        "role": "Admin",
        "phone": "+91 98765 43214",
        "address": "Administrative Central Tower, Level 5",
    },
]

SPECIFIC_VENUES = [
    {"name": "Anna Auditorium", "location": "Main Campus", "capacity": 1800},
    {"name": "Bhagat Singh Gallery", "location": "Silver Jubilee Tower", "capacity": 500},
    {"name": "TTVOC Gallery I", "location": "Technical Tower (TT)", "capacity": 800},
    {"name": "TTVOC Gallery II", "location": "Technical Tower (TT)", "capacity": 498},
    {"name": "TT Shakespeare Gallery", "location": "Technical Tower (TT)", "capacity": 378},
    {"name": "Channa Reddy Auditorium", "location": "MGR Block", "capacity": 600},
    {"name": "CS HALL", "location": "Main Campus", "capacity": 800},
]

EQUIPMENT_CATALOG = [
    # Audio
    {"name": "High-Power PA System Unit 1", "equipment_type": "Audio", "condition": "Good"},
    {"name": "High-Power PA System Unit 2", "equipment_type": "Audio", "condition": "Good"},
    {"name": "Wireless Mics (Dual Handheld Kit A)", "equipment_type": "Audio", "condition": "Good"},
    {"name": "Wireless Mics (Lapel Collar Kit B)", "equipment_type": "Audio", "condition": "Good"},
    # Visual
    {"name": "4K High-Lumen Laser Projector - TT", "equipment_type": "Visual", "condition": "Good"},
    {"name": "Ultra-HD Conference Projector - SJT", "equipment_type": "Visual", "condition": "Good"},
    {"name": "Modular LED Video Wall Screen (Stage Main)", "equipment_type": "Visual", "condition": "Good"},
    {"name": "Mobile Outdoor LED Screen Display", "equipment_type": "Visual", "condition": "Good"},
    # Furniture
    {"name": "Teak Wood Stage Podium - Unit 1", "equipment_type": "Furniture", "condition": "Good"},
    {"name": "Teak Wood Stage Podium - Unit 2", "equipment_type": "Furniture", "condition": "Good"},
    {"name": "Event Registration Desk Set (6-foot)", "equipment_type": "Furniture", "condition": "Good"},
    {"name": "Heavy-Duty Padded Folding Chairs (Lot of 100)", "equipment_type": "Furniture", "condition": "Good"},
    # Signage
    {"name": "Retractable Rollup Welcome Banners", "equipment_type": "Signage", "condition": "Good"},
    {"name": "Stage Media Backdrop Truss (8x12ft)", "equipment_type": "Signage", "condition": "Good"},
    # Safety
    {"name": "Crowd-Control Stanchion Retractable Barriers (Set of 10)", "equipment_type": "Safety", "condition": "Good"},
    {"name": "Comprehensive Emergency Trauma First-Aid Kit", "equipment_type": "Safety", "condition": "Good"},
]


# ==========================================
# SEEDING FUNCTIONS
# ==========================================

def clear_existing_data(db):
    """Cleanly purge test accounts, proposals, and resources to prevent duplicate key errors."""
    print("[Clean Mode] Purging existing seed data...")

    # Purge dependent tables first
    db.query(ApprovalNode).delete()
    db.query(ApprovalWorkflow).delete()
    db.query(RiskAssessment).delete()
    db.query(Budget).delete()
    db.query(Document).delete()
    db.query(EventDetails).delete()
    db.query(Schedule).delete()
    db.query(EventProposal).delete()
    db.query(Resource).delete()
    db.query(Vendor).delete()

    # Clean existing test users
    test_emails = [u["email"] for u in TEST_USERS]
    existing_users = db.query(User).filter(User.email.in_(test_emails)).all()
    for user in existing_users:
        db.delete(user)

    db.commit()
    print("   [OK] Existing seed data cleared successfully.")


def seed_roles(db):
    """Ensure standard RBAC roles exist in the database."""
    print("[1/5] Seeding System Roles...")
    role_map = {}
    for role_name, description in SYSTEM_ROLES:
        role = db.query(Role).filter(Role.role_name == role_name).first()
        if not role:
            role = Role(role_name=role_name, description=description)
            db.add(role)
            db.flush()
            print(f"   + Created Role: {role_name}")
        else:
            print(f"   * Role exists: {role_name}")
        role_map[role_name] = role
    db.commit()
    return role_map


def seed_users(db, role_map):
    """Seed test RBAC user accounts with properly hashed passwords."""
    print("[2/5] Seeding System RBAC Test Users...")
    hashed_password = pwd_context.hash("password123")
    user_map = {}

    for user_info in TEST_USERS:
        email = user_info["email"]
        user = db.query(User).filter(User.email == email).first()

        if not user:
            role_obj = role_map.get(user_info["role"])
            user = User(
                name=user_info["name"],
                email=email,
                password=hashed_password,
                status=True,
                roles=[role_obj] if role_obj else [],
            )
            db.add(user)
            db.flush()

            # Create associated user profile
            profile = UserProfile(
                user_id=user.id,
                phone=user_info["phone"],
                address=user_info["address"],
            )
            db.add(profile)
            print(f"   + Created User: {email} (Role: {user_info['role']})")
        else:
            # Ensure password and role are up to date
            user.password = hashed_password
            role_obj = role_map.get(user_info["role"])
            if role_obj and role_obj not in user.roles:
                user.roles.append(role_obj)
            print(f"   * Updated User: {email} (Role: {user_info['role']})")

        user_map[email] = user

    db.commit()
    return user_map


def seed_venues(db):
    """Seed individual specific venues and bulk venues generated in loops."""
    print("[3/5] Seeding Campus Venues...")
    created_count = 0

    # 1. Specific Venues
    for item in SPECIFIC_VENUES:
        existing = db.query(Venue).filter(Venue.name == item["name"]).first()
        if not existing:
            venue = Venue(
                name=item["name"],
                location=item["location"],
                capacity=item["capacity"],
                status="Available",
            )
            db.add(venue)
            created_count += 1
            print(f"   + Specific Venue: {item['name']} (Cap: {item['capacity']}, Loc: {item['location']})")

    # 2. Bulk Smart Classrooms (01 - 10)
    for i in range(1, 11):
        name = f"Smart Classroom - {i:02d}"
        if not db.query(Venue).filter(Venue.name == name).first():
            db.add(Venue(
                name=name,
                location="SJT",
                capacity=90,
                status="Available",
            ))
            created_count += 1

    # 3. Bulk Smart Labs (01 - 10)
    for i in range(1, 11):
        name = f"Smart Lab - {i:02d}"
        if not db.query(Venue).filter(Venue.name == name).first():
            db.add(Venue(
                name=name,
                location="PRP",
                capacity=120,
                status="Available",
            ))
            created_count += 1

    # 4. Bulk Outdoor Stadiums (01 & 02)
    for i in (1, 2):
        name = f"Outdoor Stadium - {i:02d}"
        if not db.query(Venue).filter(Venue.name == name).first():
            db.add(Venue(
                name=name,
                location="Mens hostel and sjt backside",
                capacity=2000,
                status="Available",
            ))
            created_count += 1

    db.commit()
    print(f"   [OK] Campus venues seeded (Total added in this run: {created_count})")


def seed_equipment(db):
    """Seed individual equipment assets grouped by domain."""
    print("[4/5] Seeding Equipment & Assets...")
    created_count = 0

    for eq in EQUIPMENT_CATALOG:
        existing = db.query(Equipment).filter(Equipment.name == eq["name"]).first()
        if not existing:
            item = Equipment(
                name=eq["name"],
                equipment_type=eq["equipment_type"],
                condition=eq["condition"],
                status="Available",
            )
            db.add(item)
            created_count += 1
            print(f"   + Equipment: [{eq['equipment_type']}] {eq['name']}")

    db.commit()
    print(f"   [OK] Equipment assets seeded (Total added in this run: {created_count})")


def seed_prototype_proposals(db, organizer_user):
    """
    Seed initial digital proposals mapped to clubs, categories, venues, and budgets.
    Enables instant end-to-end prototyping on the frontend without manual creation.
    """
    print("[5/5] Seeding Master Proposals & Workflows across Clubs & Categories...")

    # Seed master vendors
    vendors = [
        Vendor(name="AcroSport Staging & Sound", email="orders@acrosport.com", bank_details="HDFC0001234 - AC 9876543210"),
        Vendor(name="DroneLab Electronic Sensors", email="info@dronelab.io", bank_details="ICIC0005678 - UPI dronelab@okicici"),
        Vendor(name="Apex University Catering", email="catering@vit.edu", bank_details="SBI0009999 - AC 1122334455"),
    ]
    for v in vendors:
        if not db.query(Vendor).filter(Vendor.name == v.name).first():
            db.add(v)
    db.flush()

    # Proposals across Categories and Clubs
    proposals_data = [
        {
            "title": "International Academic Hackathon & AI Symposium",
            "club": "Systema",
            "category": "Hackathon",
            "venue": "Anna Auditorium",
            "expected_participants": 450,
            "status": "Submitted",
            "allocated_budget": 15000.0,
            "current_spent": 3200.0,
            "days_offset": 14,
        },
        {
            "title": "Google Cloud & Distributed Systems Workshop",
            "club": "GDG Tech",
            "category": "Technical Workshop",
            "venue": "TTVOC Gallery I",
            "expected_participants": 320,
            "status": "Submitted",
            "allocated_budget": 8500.0,
            "current_spent": 1200.0,
            "days_offset": 21,
        },
        {
            "title": "Women in Technology Leadership Keynote",
            "club": "IEEE Women in Engineering",
            "category": "Guest Lecture",
            "venue": "Bhagat Singh Gallery",
            "expected_participants": 280,
            "status": "Approved",
            "allocated_budget": 6000.0,
            "current_spent": 5500.0,
            "days_offset": 7,
        },
        {
            "title": "Riviera Cultural Showcase & Arts Festival",
            "club": "Cultural Board",
            "category": "Cultural Festival",
            "venue": "CS HALL",
            "expected_participants": 750,
            "status": "Draft",
            "allocated_budget": 25000.0,
            "current_spent": 0.0,
            "days_offset": 30,
        },
        {
            "title": "Computer Society Global Alumni Conclave",
            "club": "Computer Society of India",
            "category": "Alumni Meet",
            "venue": "TT Shakespeare Gallery",
            "expected_participants": 220,
            "status": "Submitted",
            "allocated_budget": 10000.0,
            "current_spent": 2000.0,
            "days_offset": 18,
        },
        {
            "title": "Inter-Collegiate Football & Track Tournament",
            "club": "Systema",
            "category": "Sports Tournament",
            "venue": "Outdoor Stadium - 01",
            "expected_participants": 1200,
            "status": "Draft",
            "allocated_budget": 18000.0,
            "current_spent": 0.0,
            "days_offset": 45,
        },
        {
            "title": "Red Cross Campus Blood Donation Drive",
            "club": "Cultural Board",
            "category": "Blood donation camp",
            "venue": "Channa Reddy Auditorium",
            "expected_participants": 400,
            "status": "Approved",
            "allocated_budget": 4500.0,
            "current_spent": 3800.0,
            "days_offset": 10,
        },
    ]

    now = datetime.now(timezone.utc)

    for pdata in proposals_data:
        existing = db.query(EventProposal).filter(EventProposal.title == pdata["title"]).first()
        if existing:
            continue

        proposal = EventProposal(
            user_id=organizer_user.id,
            title=pdata["title"],
            status=pdata["status"],
            team_data={
                "team_name": pdata["club"],
                "category": pdata["category"],
                "members": [
                    {"name": organizer_user.name, "role": "Lead Organizer"},
                    {"name": "Ananya Sharma", "role": "Logistics Lead"},
                    {"name": "Rahul Verma", "role": "Finance Secretary"},
                ],
            },
        )
        db.add(proposal)
        db.flush()

        # Add Details
        start_date = now + timedelta(days=pdata["days_offset"])
        end_date = start_date + timedelta(hours=10)

        details = EventDetails(
            proposal_id=proposal.id,
            description=f"Official university campus event organized by {pdata['club']} under the {pdata['category']} program.",
            objective=pdata["category"],
            expected_participants=pdata["expected_participants"],
        )
        db.add(details)

        # Add Schedule
        schedule = Schedule(
            proposal_id=proposal.id,
            start_date=start_date,
            end_date=end_date,
            venue_preference=pdata["venue"],
        )
        db.add(schedule)

        # Add Budget
        budget = Budget(
            proposal_id=proposal.id,
            allocated_amount=pdata["allocated_budget"],
            current_spent=pdata["current_spent"],
            status="Approved" if pdata["status"] == "Approved" else "Pending",
        )
        db.add(budget)

        print(f"   + Proposal: [{pdata['club']}] {pdata['title']} ({pdata['category']})")

    db.commit()
    print("   [OK] Prototype proposals seeded.")


def main():
    parser = argparse.ArgumentParser(
        description="Seed database with master catalog data and RBAC test accounts."
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Purge existing seed data before seeding new records.",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("[*] UNIVERSITY EVENT MANAGEMENT - DATABASE SEEDING SCRIPT")
    print("=" * 70)

    # Initialize tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if args.clean:
            clear_existing_data(db)

        role_map = seed_roles(db)
        user_map = seed_users(db, role_map)
        seed_venues(db)
        seed_equipment(db)

        organizer_user = user_map.get("prakhar.sethi@vit.edu")
        if organizer_user:
            seed_prototype_proposals(db, organizer_user)

        print("=" * 70)
        print("[SUCCESS] SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print("Test Accounts for Login Testing (Password: password123):")
        for u in TEST_USERS:
            print(f"  * {u['email']:<26} | Role: {u['role']}")
        print("=" * 70)
        print(f"Categories Seeded: {', '.join(CATEGORIES)}")
        print(f"Clubs Seeded:      {', '.join(CLUBS)}")
        print("=" * 70)

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR during seeding]: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
