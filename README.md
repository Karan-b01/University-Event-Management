# UniEvent: Enterprise Event Management and Compliance Engine

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

> **UniEvent** is an enterprise-grade event governance and compliance management platform engineered to automate collegiate operations, transactional asset booking, and institutional fiscal workflows.
>
> **Architected and Developed by:**
> - **Prakhar Sethi** — *Project Head, Systema Tech Club*, Vellore Institute of Technology (VIT)
> - **Karan** — *Lead Full-Stack Engineer*, Vellore Institute of Technology (VIT)

---

## 📑 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [System Architecture & OOAD Principles](#-system-architecture--ooad-principles)
3. [Core Subsystems](#-core-subsystems)
4. [High-Concurrency Engine & Pessimistic Locking](#-high-concurrency-engine--pessimistic-locking)
5. [Compliance Routing, Risk Analysis & RBAC](#-compliance-routing-risk-analysis--rbac)
6. [Design System: Editorial Monochrome](#-design-system-editorial-monochrome)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [Automated Verification & Testing](#-automated-verification--testing)
9. [Repository Layout](#-repository-layout)
10. [Authors & Acknowledgments](#-authors--acknowledgments)

---

## 🏛️ Executive Summary

University event management in tier-1 institutions is frequently hindered by bureaucratic paper trails, uncoordinated schedule collisions, budget discrepancies, and safety oversights. **UniEvent** eliminates these vulnerabilities with an automated, auditable, and mathematically rigorous event operating system.

Built from the ground up on modern **Object-Oriented Analysis and Design (OOAD)** concepts, UniEvent unifies event proposal intake, automated safety pre-screening, pessimistic concurrency resource scheduling, 1-to-1 budget tracking, duplicate-receipt fraud prevention, and role-based cryptographic approvals into a single reactive platform.

---

## 📐 System Architecture & OOAD Principles

UniEvent applies strict OOAD principles to separate business concerns, maintain encapsulation, and ensure loose coupling between service layers.

```text
                                  ┌───────────────────────────┐
                                  │      Client Surface       │
                                  │  (React 19 + TailwindCSS) │
                                  └─────────────┬─────────────┘
                                                │ REST API (JSON / Multipart)
                                                ▼
                                  ┌───────────────────────────┐
                                  │   FastAPI Gateway Router  │
                                  │  (JWT + Session Validator)│
                                  └─────────────┬─────────────┘
                                                │
         ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                  ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ User & Access   │ │ Proposal Engine │ │  Finance Desk │ │ Resource Matrix │ │  Compliance &   │
│ Management      │ │   & Documents   │ │  & Gateways   │ │ & Concurrency   │ │ Workflow Engine │
│ (AuthService)   │ │(ProposalService)│ │(FinanceService│ │(ResourceService)│ │(ApprovalService)│
└────────┬────────┘ └────────┬────────┘ └───────┬───────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                  │                  │                   │
         └───────────────────┴──────────┬───────┴──────────────────┴───────────────────┘
                                        │ SQLAlchemy ORM 2.0 (Unit of Work)
                                        ▼
                         ┌─────────────────────────────┐
                         │    PostgreSQL Database      │
                         │(Pessimistic Locks, STI, WFU)│
                         └─────────────────────────────┘
```

### 1. Single Table Inheritance (STI) for Polymorphic Hierarchies
To eliminate unnecessary join operations across entity subclasses while preserving strict relational integrity, the platform utilizes SQLAlchemy Single Table Inheritance (`type` polymorphic discriminators) for three critical domain hierarchies:

- **Campus Resources (`resources` table)**:
  - Base class: `Resource`
  - Subclasses: `Venue` (adds `capacity`, `location`), `Equipment` (adds `equipment_type`, `condition`), `Transport` (adds `vehicle_number`, `driver_info`), and `Accommodation` (adds `room_count`, `building`).
- **Proposal Attachments (`documents` table)**:
  - Base class: `Document`
  - Subclasses: `Poster` (marketing material, visual metadata) and `VendorQuotation` (procurement bids, cost verification).
- **Financial Transactions (`transactions` table)**:
  - Base class: `Transaction`
  - Subclasses: `BankTransfer`, `UPITransfer`, and `Cheque` (encapsulating distinct transaction references, clearance timestamps, and channel attributes).

### 2. Service Layer & Gateway Abstractions
- **Dependency Inversion**: Business logic is decoupled from HTTP transport. Routers invoke pure domain services (`AuthService`, `ProposalService`, `FinanceService`, `ResourceService`, `ComplianceValidatorService`).
- **Adapter Pattern**: Communication with external systems (notification delivery, payment processors) is mediated by gateway interfaces (`EmailGateway`, `SMSGateway`, `UniversityPaymentGatewayAdapter`), allowing zero-downtime mock substitution during integration testing.

---

## ⚙️ Core Subsystems

### Module 01: User & Access Management
- **Hybrid Stateless/Stateful Authentication**: Combines cryptographic JWT bearer tokens with active database `Session` records. Users can log out instantly with immediate server-side token revocation without compromising stateless read speed.
- **Many-to-Many RBAC**: Supports granular, multi-role users across university governance personas (`Student Organizer`, `Faculty Advisor`, `Finance Officer`, `Security Officer`, `Admin`).
- **Profile Decoupling**: Separates authentication credentials (`User`) from university demographic data (`UserProfile`).

### Module 02: Event Proposal Governance
- **Progressive Draft Intake**: Organizers can persist incomplete proposals with partial states (`Draft`) across complex planning stages.
- **Submission Gatekeeper**: Transitions from `Draft` to `Submitted` only when complete schedules, participant estimates, event details, and required document attachments are present and validated.
- **Lightweight Committee Rostering**: Employs flexible schema-less JSON columns for organizing committee assignments, roles, and contacts.

### Module 03: Finance & Disbursal Desk
- **1-to-1 Budget Tracking**: Every sanctioned proposal is bound to an active fiscal budget monitoring `allocated_amount` against real-time `current_spent`.
- **Anti-Fraud Duplicate Invoice Detection**: Rejects duplicate vendor invoices by computing unique triples across `(vendor_id, amount, invoice_date)`. Resubmitted receipts are flagged and blocked immediately with `400 Bad Request`.
- **Cumulative Overrun Prevention**: Real-time evaluation of committed expenditures automatically transitions budgets into `'Overrun'` if sub-expenses exceed allocated limits.
- **Mandatory Reduction Justification**: When finance officials reduce a requested disbursement amount, institutional regulations enforce a mandatory justification note prior to authorization.

### Module 04: Resource Scheduling Matrix
- **Weekly Matrix Grid**: Organizers and administrators visually browse availability across campuses.
- **Damage & Incident Logging**: Post-event asset inspections record conditions, incident photographs, and estimated repair costs via `DamageReport`.

### Module 05: Compliance & Multi-Tier Approval Engine
- **Pre-Screening Risk Analysis**: Evaluates high-risk events before human intervention.
- **Dynamic Tier Routing**: Configures multi-tier state machine nodes dynamically based on calculated risk profiles.
- **Immutable Audit Trail**: Chronologically logs all state transitions, reviewer notes, and decision timestamps into `ApprovalHistory`.

---

## 🔒 High-Concurrency Engine & Pessimistic Locking

The primary vulnerability in physical campus scheduling is the **double-booking race condition** when multiple organizing teams attempt to secure the same auditorium or laboratory simultaneously.

UniEvent solves this using **PostgreSQL row-level pessimistic locking** coupled with **mathematical interval intersection logic**.

```text
Concurrent Request A (Venue #1, 14:00 - 16:00) ──┐
                                                 ├─► [BEGIN TRANSACTION]
Concurrent Request B (Venue #1, 15:00 - 17:00) ──┘        │
                                                          ▼
                                            SELECT * FROM resources
                                            WHERE id = 1
                                            FOR UPDATE;  ◄─── [Pessimistic Row Lock Acquired by A]
                                                          │
                                                          ├── Request A: Validates Interval Overlap
                                                          │              (No existing booking found)
                                                          │              Inserts Booking Record
                                                          │              [COMMIT TRANSACTION] ──► 201 Created
                                                          │
                                                          ▼
                                            [Lock released to Request B]
                                                          │
                                                          ├── Request B: Validates Interval Overlap
                                                          │              (Conflict detected with A)
                                                          │              [ROLLBACK TRANSACTION] ──► 409 Conflict
```

### 1. Row-Level Concurrency Control
When an organizer requests a booking, the backend opens a transactional boundary and queries the physical asset using SQLAlchemy's `.with_for_update()`:

```python
# Atomic row lock prevents concurrent reads/writes on this resource until commit
resource = (
    db.query(Resource)
    .filter(Resource.id == booking_data.resource_id)
    .with_for_update()
    .first()
)
```

This guarantees that any other transaction attempting to evaluate or book the same resource is queued at the database level until the current transaction completes.

### 2. Mathematical Interval Overlap Detection
Within the locked transaction, existing confirmed reservations for the target asset are evaluated against the requested time window using strict boundary intersection logic:

$$\text{Collision} \iff \left(\text{Existing.Start} < \text{Requested.End}\right) \land \left(\text{Existing.End} > \text{Requested.Start}\right)$$

In SQLAlchemy:
```python
overlapping = (
    db.query(Booking)
    .filter(
        Booking.resource_id == booking_data.resource_id,
        Booking.status == "Confirmed",
        Booking.start_time < booking_data.end_time,
        Booking.end_time > booking_data.start_time,
    )
    .first()
)

if overlapping:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Resource is already reserved from {overlapping.start_time} to {overlapping.end_time}."
    )
```

If an overlap exists, the transaction rolls back cleanly and returns **`409 Conflict`**, preventing phantom reads and duplicate bookings.

---

## 🛡️ Compliance Routing, Risk Analysis & RBAC

### Automated Pre-Screening Engine (`ComplianceValidatorService`)
Prior to human routing, submitted event proposals undergo automated heuristic evaluation:

1. **Capacity Overcrowding**: Compares `EventDetails.expected_participants` against physical `Venue.capacity`. If attendance exceeds venue limit, a high-risk flag is assigned.
2. **Extended & Overnight Schedules**: Events operating after 22:00 or exceeding 12 continuous hours trigger an automatic campus security screening flag.
3. **Mass Gathering Safety ($\ge 400$ attendees)**: Automatically enforces medical standby and fire hazard protocol requirements.

The engine computes a numerical risk score ($0 - 100$) and generates an actionable `RiskAssessment` object containing specific mitigation suggestions.

### Dynamic Multi-Tier Routing Nodes
Workflows are not hardcoded static lists. The routing engine adjusts nodes based on risk:
- **Low Risk ($\text{Score} < 40$)**: Routed through `Faculty Advisor` $\rightarrow$ `Finance Officer`.
- **High Risk ($\text{Score} \ge 40$)**: The engine dynamically injects a `Security Officer` node into the review tier chain.

### Immutable Workflow Payment Lock Gate
To prevent premature institutional sign-offs:
- The `Finance Officer` approval button is strictly locked in the UI and rejected at the API layer until itemized receipts have been verified and confirmed via the Finance Desk.
- Attempts to approve the proposal before payment confirmation return an actionable error and guidance banner.

---

## 🎨 Design System: Editorial Monochrome

The frontend features an **"Editorial Monochrome"** aesthetic that prioritizes legibility, typographic balance, and visual hierarchy, intentionally departing from generic neon AI aesthetics.

| Mode | Canvas (`bg`) | Elevated Surface / Cards (`bg`) | Primary Typography | Borders |
| :--- | :--- | :--- | :--- | :--- |
| **Light Mode** | `#F7F7F5` (`bg-stone-50`) | `#F5F5F4` (`bg-stone-100`) | `#171717` (`text-neutral-900`) | `#E7E5E4` (`border-stone-200`) |
| **Dark Mode** | `#111111` (`bg-[#111111]`) | `#1A1A1A` (`bg-[#1A1A1A]`) | `#E5E5E5` (`text-neutral-200`) | `#2A2A2A` (`border-[#2A2A2A]`) |

### Key UX Principles:
- **Glare-Free Surfaces**: Pure `#FFFFFF` is replaced with subtle stone off-white (`#F7F7F5`), eliminating high-contrast eye strain.
- **Stark Off-Black**: Pure `#000000` is softened to obsidian off-black (`#111111`), providing rich contrast while preserving subtle element depth.
- **Monochrome Action Accents**: Neon green and emerald accents are completely eliminated. Action controls use solid neutral contrast:
  - **Light Mode Primary Buttons**: Dark `bg-neutral-900 text-stone-50`.
  - **Dark Mode Primary Buttons**: Soft white `bg-stone-200 text-neutral-900`.
- **Subtle Micro-Borders**: Defined with 1px stone dividers (`border-stone-200` / `border-[#2A2A2A]`) rather than heavy drop shadows.
- **Typographic Pairings**: Combines modern sans-serif body typography (*Inter*) with timeless editorial serif headings (*Playfair Display*).

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Python**: `3.11+`
- **Node.js**: `18.0+` & `npm`
- **PostgreSQL**: `15+` (Optional for local testing; SQLite in-memory fallback enabled by default)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Karan-b01/University-Event-Management.git
cd University-Event-Management
```

---

### Step 2: Backend Setup & Configuration

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```bash
cp .env.example .env
```

Ensure `.env` contains the required keys:
```ini
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/university_event_db
SECRET_KEY=supersecretjwtsecretkey_replace_with_strong_key_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
APP_NAME="University Event Management and Compliance System"
API_V1_STR=/api/v1
ENVIRONMENT=development
```
*(Note: If PostgreSQL is not running locally, the backend automatically initializes an in-memory SQLite database for zero-config evaluation).*

#### Seed Database
Populate database schemas, demo RBAC accounts, campus venues, resources, vendors, and initial proposals:
```bash
python seed.py --clean
```

#### Start FastAPI Backend Server
```bash
python run.py
# Server runs at http://127.0.0.1:8000
# OpenAPI Docs: http://127.0.0.1:8000/docs
```

---

### Step 3: Frontend Setup

Open a separate terminal in the project root:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Application accessible at http://localhost:5173
```

---

### Demo User Accounts

| Role | Email | Password | Primary Clearance |
| :--- | :--- | :--- | :--- |
| **Student Organizer** | `organizer@vit.ac.in` | `password123` | Proposal submission, itemized budgets, upload receipts |
| **Faculty Advisor** | `advisor@vit.ac.in` | `password123` | Tier-1 proposal approval & budget validation |
| **Finance Officer** | `finance@vit.ac.in` | `password123` | Budget sanction, wire/UPI payment disbursement, receipt audit |
| **Security Officer** | `security@vit.ac.in` | `password123` | High-risk gate approval, safety & medical clearance |
| **System Administrator**| `admin@vit.ac.in` | `password123` | User access administration, global system oversight |

---

## 🧪 Automated Verification & Testing

UniEvent includes an automated test suite verifying all 5 core modules with transactional database isolation:

```bash
cd backend
python -m pytest tests -v
```

### Test Coverage Highlights:
- **`tests/test_auth.py` (8 Tests)**: Registration, JWT issuance, RBAC permissions, session revocation, gateway calls.
- **`tests/test_proposals.py` (5 Tests)**: Draft progression, schema validation, STI document attachments, export serialization.
- **`tests/test_resources.py` (4 Tests)**: Asset catalog creation, all 6 mathematical interval overlap concurrency scenarios, row locks, damage logs.
- **`tests/test_finance.py` (4 Tests)**: Budget limit enforcement, duplicate invoice triple detection, payment disbursements.
- **`tests/test_approvals.py` (3 Tests)**: Automated compliance pre-screening, dynamic multi-tier routing, rejection halts.

```text
============================== 24 passed in 24.8s ==============================
```

---

## 📂 Repository Layout

```text
University-Event-Management/
├── backend/
│   ├── app/
│   │   ├── core/                      # Config, JWT issuance & RBAC dependencies
│   │   ├── models/                    # SQLAlchemy ORM Models (STI polymorphic entities)
│   │   │   ├── user.py                # User, Role, UserProfile, Session
│   │   │   ├── proposal.py            # EventProposal, EventDetails, Schedule, Document (STI)
│   │   │   ├── resource.py            # Resource (STI: Venue, Equipment, Transport), Booking
│   │   │   ├── finance.py             # Budget, Vendor, Expense, Receipt, Transaction (STI)
│   │   │   └── approval.py            # ApprovalWorkflow, ApprovalNode, ApprovalHistory
│   │   ├── routers/                   # FastAPI route controllers
│   │   ├── schemas/                   # Pydantic v2 data contracts
│   │   ├── services/                  # Pure domain logic, validators & gateway adapters
│   │   └── main.py                    # Application factory & lifespan setup
│   ├── tests/                         # Integration test suite (24 tests)
│   ├── uploads/                       # Partitioned document storage
│   ├── requirements.txt               # Python package dependencies
│   ├── seed.py                        # Database migration & master data seeder
│   └── run.py                         # Local Uvicorn launcher
├── frontend/
│   ├── src/
│   │   ├── api/                       # Axios client & REST endpoint bindings
│   │   ├── components/                # Modular UI component catalog
│   │   │   ├── common/                # Button, Card, Badge, Input, Modal, ThemeToggle
│   │   │   ├── layout/                # Navbar, Footer
│   │   │   └── auth/                  # AuthModal, Account Switcher
│   │   ├── pages/                     # Enterprise workflow views
│   │   │   ├── LandingPage.jsx        # Public showcase & capabilities overview
│   │   │   ├── StudentDashboard.jsx   # Organizer lifecycle & proposal tracker
│   │   │   ├── ProposalWizard.jsx     # 4-step intake wizard & compliance forms
│   │   │   ├── ApprovalInbox.jsx      # Multi-tier routing & audit trail inbox
│   │   │   ├── FinanceDesk.jsx        # Disbursals, invoice review & payment gateway
│   │   │   ├── ResourceCalendar.jsx   # Availability matrix & pessimistic booking
│   │   │   └── UserManagement.jsx     # Administrator account & role assignment
│   │   ├── App.jsx                    # Root view & layout routing
│   │   └── index.css                  # Editorial monochrome CSS tokens
│   ├── tailwind.config.js             # Tailwind design system configuration
│   ├── package.json                   # React 19 & toolchain dependencies
│   └── vite.config.js                 # Vite build & asset pipeline
└── README.md                          # Enterprise documentation & portfolio report
```

---

## 👨‍💻 Authors & Acknowledgments

Developed as an Object-Oriented Analysis and Design (OOAD) project for enterprise university administration.

- **Prakhar Sethi** — *Project Head, Systema Tech Club*, Vellore Institute of Technology (VIT)
- **Karan** — *Lead Full-Stack Engineer*, Vellore Institute of Technology (VIT)

<div align="center">
  <sub>Engineered with precision for Vellore Institute of Technology.</sub>
</div>