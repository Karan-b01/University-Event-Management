import pytest
from datetime import date

def get_auth_header(client, email: str, role: str):
    """Helper to register & login a user with given role and return bearer header."""
    reg_payload = {
        "name": f"User {role}",
        "email": email,
        "password": "Password123!",
        "role_name": role
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_vendor_registration_and_listing(client):
    finance_headers = get_auth_header(client, "finance1@university.edu", "Finance Officer")

    vendor_payload = {
        "name": "Acme Catering Services",
        "email": "contact@acmecatering.com",
        "bank_details": "ACME-BANK-987654321, IFSC: SBIN0001234"
    }
    res_create = client.post("/api/v1/finance/vendors", json=vendor_payload, headers=finance_headers)
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["name"] == "Acme Catering Services"
    assert data["email"] == "contact@acmecatering.com"

    res_list = client.get("/api/v1/finance/vendors")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1


def test_budget_creation_and_retrieval(client):
    organizer_headers = get_auth_header(client, "organizer_fin@university.edu", "Student Organizer")
    finance_headers = get_auth_header(client, "finance2@university.edu", "Finance Officer")

    # 1. Create a proposal
    draft_res = client.post("/api/v1/proposals/draft", json={"title": "Robotics Expo 2026"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    # 2. Finance Officer creates budget
    budget_payload = {
        "proposal_id": proposal_id,
        "allocated_amount": 5000.0
    }
    res_budget = client.post("/api/v1/finance/budgets", json=budget_payload, headers=finance_headers)
    assert res_budget.status_code == 201
    budget_data = res_budget.json()
    assert budget_data["proposal_id"] == proposal_id
    assert budget_data["allocated_amount"] == 5000.0
    assert budget_data["current_spent"] == 0.0

    # 3. Retrieve budget
    res_get = client.get(f"/api/v1/finance/budgets/{proposal_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == budget_data["id"]


def test_expense_submission_duplicate_detection_and_overrun(client):
    organizer_headers = get_auth_header(client, "organizer_exp@university.edu", "Student Organizer")
    finance_headers = get_auth_header(client, "finance3@university.edu", "Finance Officer")

    # 1. Create proposal & budget of $1000
    draft_res = client.post("/api/v1/proposals/draft", json={"title": "AI Seminar"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]
    budget_res = client.post("/api/v1/finance/budgets", json={"proposal_id": proposal_id, "allocated_amount": 1000.0}, headers=finance_headers)
    budget_id = budget_res.json()["id"]

    # 2. Register a vendor
    vendor_res = client.post("/api/v1/finance/vendors", json={
        "name": "Audio Visual Rentals",
        "email": "av@rentals.com",
        "bank_details": "AV-BANK-11223344"
    }, headers=finance_headers)
    vendor_id = vendor_res.json()["id"]

    # 3. Submit initial expense of $400 with receipt
    today_str = date.today().isoformat()
    expense_payload = {
        "budget_id": budget_id,
        "vendor_id": vendor_id,
        "amount": 400.0,
        "category": "Logistics",
        "receipt": {
            "amount": 400.0,
            "date": today_str,
            "file_path": "/uploads/receipts/av_invoice_001.pdf"
        }
    }
    res_exp1 = client.post("/api/v1/finance/expenses", json=expense_payload, headers=organizer_headers)
    assert res_exp1.status_code == 201
    assert res_exp1.json()["amount"] == 400.0
    assert res_exp1.json()["status"] == "Submitted"

    # 4. CRITICAL TEST: Attempt Duplicate Expense (same vendor, amount, receipt date) -> Expect 400 Bad Request
    res_dup = client.post("/api/v1/finance/expenses", json=expense_payload, headers=organizer_headers)
    assert res_dup.status_code == 400
    assert "Duplicate Expense Detected" in res_dup.json()["detail"]

    # 5. Submit another expense of $700 (400 + 700 = 1100 > 1000 allocated) -> Expect Budget Overrun flag
    overrun_expense_payload = {
        "budget_id": budget_id,
        "vendor_id": vendor_id,
        "amount": 700.0,
        "category": "Logistics",
        "receipt": {
            "amount": 700.0,
            "date": today_str,
            "file_path": "/uploads/receipts/av_invoice_002.pdf"
        }
    }
    res_exp2 = client.post("/api/v1/finance/expenses", json=overrun_expense_payload, headers=organizer_headers)
    assert res_exp2.status_code == 201

    # Check budget status is flagged as 'Overrun'
    budget_check = client.get(f"/api/v1/finance/budgets/{proposal_id}")
    assert budget_check.json()["status"] == "Overrun"


def test_payment_disbursement_workflow(client):
    organizer_headers = get_auth_header(client, "organizer_pay@university.edu", "Student Organizer")
    finance_headers = get_auth_header(client, "finance_officer_pay@university.edu", "Finance Officer")
    student_headers = get_auth_header(client, "unauthorized_student@university.edu", "Student")

    # 1. Setup Proposal, Budget ($2000), Vendor, and Expense ($500)
    draft_res = client.post("/api/v1/proposals/draft", json={"title": "Music Fest"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]
    budget_res = client.post("/api/v1/finance/budgets", json={"proposal_id": proposal_id, "allocated_amount": 2000.0}, headers=finance_headers)
    budget_id = budget_res.json()["id"]

    vendor_res = client.post("/api/v1/finance/vendors", json={
        "name": "Stage Lights Ltd",
        "email": "lights@stageltd.com",
        "bank_details": "LIGHTS-BANK-556677"
    }, headers=finance_headers)
    vendor_id = vendor_res.json()["id"]

    expense_res = client.post("/api/v1/finance/expenses", json={
        "budget_id": budget_id,
        "vendor_id": vendor_id,
        "amount": 500.0,
        "category": "Lighting"
    }, headers=organizer_headers)
    expense_id = expense_res.json()["id"]

    # 2. Unauthorized student attempts payment -> 403 Forbidden
    pay_payload = {
        "payment_type": "BankTransfer",
        "bank_account": "1234567890",
        "ifsc": "SBIN0009999"
    }
    res_unauth = client.post(f"/api/v1/finance/expenses/{expense_id}/pay", json=pay_payload, headers=student_headers)
    assert res_unauth.status_code == 403

    # 3. Finance Officer pays expense -> Triggers UniversityPaymentGatewayAdapter
    res_pay = client.post(f"/api/v1/finance/expenses/{expense_id}/pay", json=pay_payload, headers=finance_headers)
    assert res_pay.status_code == 200
    pay_data = res_pay.json()
    assert pay_data["expense_status"] == "Paid"
    assert pay_data["amount_paid"] == 500.0
    assert "TXN-MOCK-" in pay_data["transaction_id"]
    assert pay_data["budget_spent"] == 500.0

    # 4. Attempting to pay an already paid expense -> 400 Bad Request
    res_repay = client.post(f"/api/v1/finance/expenses/{expense_id}/pay", json=pay_payload, headers=finance_headers)
    assert res_repay.status_code == 400
    assert "already been paid" in res_repay.json()["detail"]

