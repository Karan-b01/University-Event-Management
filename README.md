# 🎓 University Event Management and Compliance System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.0+-E92063.svg?style=flat&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Tests](https://img.shields.io/badge/Tests-24%20Passing-brightgreen.svg?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org/)

A robust, enterprise-grade backend platform built to modernize and digitize university event operations. Designed using strict **Object-Oriented Analysis and Design (OOAD)** principles, this platform replaces fragmented, paper-based workflows with automated multi-tier approval routing, transactional resource locking, duplicate-proof financial tracking, and immutable audit logs.

---

## 🏛️ System Overview & Core Modules

The system is partitioned into 5 decoupled domain modules mapping directly to institutional workflows:

```text
                                  ┌────────────────────────┐
                                  │   FastAPI Gateway      │
                                  │   & RBAC Middleware    │
                                  └───────────┬────────────┘
                                              │
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Module 1:    │ │    Module 2:    │ │ Module 3: │ │    Module 4:    │ │    Module 5:    │
│  User & Access  │ │ Proposal Engine │ │  Finance  │ │    Resource     │ │  Compliance &   │
│   Management    │ │   & Documents   │ │ & Payment │ │   Concurrency   │ │ Approval Engine │
└─────────────────┘ └─────────────────┘ └───────────┘ └─────────────────┘ └─────────────────┘
```

---

### 🔑 Module 1: User & Role Management
- **Hybrid Authentication**: Implements JWT access tokens coupled with database-backed `Session` validation, enabling instant server-side revocation on logout without sacrificing stateless API performance.
- **Many-to-Many RBAC**: Enforces granular permissions via a flexible `user_roles` association supporting multiple roles per user (`Admin`, `Student Organizer`, `Faculty Advisor`, `Finance Officer`, `Security Officer`).
- **One-to-One Profiles**: Strict separation between core authentication entities (`User`) and extended contact metadata (`UserProfile`).
- **External Gateways**: Abstractions for `EmailGateway`, `SMSGateway`, and `CAPTCHA` verification services.

---

### 📝 Module 2: Event Proposal Management
- **Progressive Drafts**: Allows organizers to persist partial proposal drafts with nullable fields while working through complex event plans.
- **Strict Submission Gatekeeper**: Validates completeness (requiring `EventDetails`, `Schedule` date integrity, and supporting `Document` attachments) before transitioning from `'Draft'` to `'Submitted'`.
- **Lightweight Team Roster**: Employs flexible `JSON` columns to document organizing committee members and roles without schema overhead.
- **Single Table Inheritance (STI) for Documents**: Polymorphic document storage on disk (`/uploads/{proposal_id}/`) and in the database supporting `Poster` and `VendorQuotation` entities.
- **UML ExportManager Simulation**: Provides an aggregated `GET /export` endpoint returning structured JSON containing all event metadata, rosters, schedules, and document paths.

---

### 💰 Module 3: Finance Management
- **1-to-1 Budget Tracking**: Establishes strict budget limits for event proposals with real-time tracking of `allocated_amount` versus `current_spent`.
- **Sub-Expense Hierarchy**: Self-referential `parent_expense_id` supporting multi-level itemized breakdown of expenses.
- **Automated Duplicate Receipt Detection**: Inspects incoming expenses and receipts against `(vendor_id, amount, receipt_date)` triples, instantly rejecting identical invoice resubmissions with `400 Bad Request`.
- **Cumulative Overrun Prevention**: Monitors cumulative commitments (paid + submitted) and automatically flags budgets as `'Overrun'` when limits are exceeded.
- **Simulated Payment Gateway**: Integrates `UniversityPaymentGatewayAdapter` with simulated network latency and polymorphic transaction logging (`BankTransfer`, `UPITransfer`, `Cheque`).

---

### 🏢 Module 4: Resource Management & Concurrency Control
- **Polymorphic Asset Catalog**: Unified Single Table Inheritance model for campus resources:
  - `Venue` (capacity, location)
  - `Equipment` (type, condition)
  - `Transport` (vehicle number, driver)
  - `Accommodation` (room count, building)
- **Pessimistic Concurrency Locking**: Employs database row-level locking via SQLAlchemy's `.with_for_update()` inside transactional blocks to eliminate booking race conditions.
- **Mathematical Interval Overlap Detection**: Prevents double-bookings by checking time intersection rules:
  $$\text{Existing.Start} < \text{Requested.End} \quad \land \quad \text{Existing.End} > \text{Requested.Start}$$
  Overlapping requests are cleanly aborted with **`409 Conflict`**.
- **Damage & Maintenance Logging**: Tracks physical asset conditions, incident photos, and repair cost estimations via `DamageReport`.

---

### 🛡️ Module 5: Approval & Compliance Engine
- **Automated Pre-Screening (`ComplianceValidatorService`)**: Programmatically assesses proposals prior to human review:
  - Compares `EventDetails.expected_participants` against requested `Venue.capacity`.
  - Flags overnight or extended (>12h) schedules for security clearance.
  - Enforces medical and fire safety stand-by rules for mass gatherings ($\ge 400$ participants).
  - *Resilient evaluation*: Generates an actionable `RiskAssessment` record with specific mitigation suggestions rather than hard-failing.
- **Dynamic Multi-Tier Routing**: Generates customized review chains based on risk profile (e.g. automatically injecting a `Security Officer` node when high risk is flagged).
- **Role-Gated Human Reviews**: Step-locked reviews requiring the reviewer to possess the exact role mandated by the active node.
- **Immutable Audit Trail**: Chronologically logs all initiation events, reviewer actions, and feedback into `ApprovalHistory`.

---

## 🏗️ Key Architectural Decisions & Design Patterns

| Pattern | Implementation in Codebase | Architectural Rationale |
| :--- | :--- | :--- |
| **Single Table Inheritance (STI)** | `Document` (`Poster`, `VendorQuotation`)<br>`Resource` (`Venue`, `Equipment`, `Transport`, `Accommodation`)<br>`Transaction` (`BankTransfer`, `UPITransfer`, `Cheque`) | Eliminates complex table joins while maintaining clean polymorphic querying across related entity hierarchies. |
| **Pessimistic Concurrency Control** | `ResourceService.book_resource` using `.with_for_update()` | Guarantees absolute transactional consistency across concurrent booking attempts without phantom reads. |
| **Dynamic State Machine Workflow** | `ApprovalWorkflow` & `ApprovalNode` | Decouples approval logic from hardcoded chains, enabling dynamic workflow generation driven by pre-screening risk algorithms. |
| **Hybrid Session-JWT Binding** | `get_current_user` verifying DB `Session.is_active` | Combines stateless JWT authorization with instant server-side revocation on logout. |
| **Database Agnostic Resilience** | `database.py` with PostgreSQL driver fallback | Enables production deployment on PostgreSQL while allowing zero-config local testing and SQLite in-memory suites. |

---

## 🚀 Getting Started / Installation

### Prerequisites
- **Python**: `3.10` or higher (Python 3.11+ recommended)
- **PostgreSQL**: `14+` (Optional for local testing; SQLite in-memory fallback included)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Karan-b01/University-Event-Management.git
cd University-Event-Management/backend
```

### 2. Set Up Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the `backend/` root (or copy `.env.example`):
```ini
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/university_event_db
SECRET_KEY=your_secure_random_jwt_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
APP_NAME="University Event Management and Compliance System"
API_V1_STR=/api/v1
ENVIRONMENT=development
```

### 5. Run the Server
```bash
# Using convenience script
python run.py

# Or directly with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📖 Interactive API Documentation

Once the server is running, explore and test the complete API surface via the interactive Swagger UI and ReDoc:

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema**: `http://127.0.0.1:8000/api/v1/openapi.json`

---

## 🧪 Comprehensive Automated Testing

The system is covered by an automated test suite of **24 integration tests** using `pytest` and in-memory database isolation with `StaticPool`.

### Running Tests
```bash
# From the backend directory
python -m pytest tests -v
```

### Test Suite Summary
```text
tests/test_auth.py (8 Tests)
  ✔ test_health_check
  ✔ test_user_registration_and_profile
  ✔ test_user_login_and_jwt_generation
  ✔ test_rbac_access_control
  ✔ test_session_invalidation_logout
  ✔ test_duplicate_registration_fails
  ✔ test_invalid_login_credentials
  ✔ test_gateways_invocations

tests/test_proposals.py (5 Tests)
  ✔ test_proposal_role_restriction
  ✔ test_proposal_draft_partial_creation
  ✔ test_proposal_update_existing_record
  ✔ test_document_upload_single_table_inheritance
  ✔ test_submit_proposal_validation_and_export

tests/test_resources.py (4 Tests)
  ✔ test_resource_creation_and_listing
  ✔ test_resource_booking_and_overlap_concurrency_prevention (All 6 Overlap Interval Scenarios)
  ✔ test_booking_cancellation_and_reslotting
  ✔ test_damage_report_submission

tests/test_finance.py (4 Tests)
  ✔ test_vendor_registration_and_listing
  ✔ test_budget_creation_and_retrieval
  ✔ test_expense_submission_duplicate_detection_and_overrun
  ✔ test_payment_disbursement_workflow

tests/test_approvals.py (3 Tests)
  ✔ test_automated_compliance_validation_and_dynamic_routing
  ✔ test_node_rbac_enforcement_and_multi_tier_approval
  ✔ test_workflow_rejection_halts_routing

============================== 24 passed in ~25s ==============================
```

---

## 📂 Repository Directory Layout

```text
University-Event-Management/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic Settings & Environment loading
│   │   │   ├── security.py            # Password hashing (bcrypt) & JWT issuance
│   │   │   └── dependencies.py        # RBAC: get_current_user, require_role
│   │   ├── database.py                # Engine, SessionLocal, Base & get_db
│   │   ├── models/                    # SQLAlchemy ORM Models
│   │   │   ├── user.py                # User, Role, user_roles, Profile, Session
│   │   │   ├── proposal.py            # EventProposal, Details, Schedule, Document (STI)
│   │   │   ├── resource.py            # Resource (STI), Booking, DamageReport
│   │   │   ├── finance.py             # Budget, Vendor, Expense, Receipt, Transaction (STI)
│   │   │   └── approval.py            # Workflow, Node, History, RiskAssessment
│   │   ├── schemas/                   # Pydantic Validation Schemas
│   │   ├── services/                  # Business Logic & Gateway Adapters
│   │   │   ├── gateways.py            # Email, SMS, CAPTCHA, PaymentGateway adapters
│   │   │   ├── auth_service.py        # Auth & session lifecycle
│   │   │   ├── proposal_service.py    # Proposal drafts, updates, export aggregation
│   │   │   ├── resource_service.py    # Pessimistic booking & concurrency control
│   │   │   ├── finance_service.py     # Budgeting, duplicate receipts, disbursements
│   │   │   ├── compliance_validator.py # Pre-screening rules (capacity, safety)
│   │   │   └── approval_service.py    # Multi-tier routing & audit logs
│   │   ├── routers/                   # API Routers (/auth, /proposals, /resources, /finance, /approvals)
│   │   └── main.py                    # FastAPI application & startup lifecycle
│   ├── tests/                         # Integration test suites (24 tests)
│   ├── uploads/                       # Local partitioned document storage
│   ├── requirements.txt               # Backend dependencies
│   ├── .env.example                   # Environment configuration template
│   └── run.py                         # Local server runner
└── README.md                          # Project documentation
```

---

## 📜 License & Acknowledgements
Built as an OOAD Backend Architecture Project for academic compliance and university event management systems.
Developed with [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/), and [PostgreSQL](https://www.postgresql.org/).


<div align="center">

# Made With ♥️ By Karan Bhatia & Prakhar Sethi

</div>