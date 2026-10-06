import pytest
from datetime import datetime, timedelta, timezone

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


def test_automated_compliance_validation_and_dynamic_routing(client):
    admin_headers = get_auth_header(client, "admin_approv@university.edu", "Admin")
    organizer_headers = get_auth_header(client, "organizer_approv@university.edu", "Student Organizer")

    # 1. Create a venue with capacity 100
    client.post("/api/v1/resources/", json={
        "name": "Mini Seminar Hall",
        "type": "Venue",
        "capacity": 100,
        "location": "Academic Block A",
        "status": "Available"
    }, headers=admin_headers)

    # 2. Create proposal with 300 expected participants (exceeds 100 capacity) and overnight schedule
    start_time = (datetime.now(timezone.utc) + timedelta(days=7)).replace(hour=18, minute=0, second=0)
    end_time = (start_time + timedelta(hours=14))  # Overnight duration

    draft_res = client.post("/api/v1/proposals/draft", json={
        "title": "Hackathon 2026",
        "details": {
            "description": "Overnight coding competition.",
            "objective": "Build projects.",
            "expected_participants": 300
        },
        "schedule": {
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "venue_preference": "Mini Seminar Hall"
        }
    }, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    # 3. Initiate Approval Workflow
    initiate_res = client.post(f"/api/v1/approvals/initiate/{proposal_id}", headers=organizer_headers)
    assert initiate_res.status_code == 201
    wf_data = initiate_res.json()
    assert wf_data["status"] == "In Progress"
    assert wf_data["current_step"] == 1

    # Verify Risk Assessment pre-screening
    risk = wf_data["risk_assessment"]
    assert risk is not None
    assert risk["is_high_risk"] is True
    assert risk["risk_score"] > 50
    assert len(risk["flag_details"]) >= 2  # Capacity violation & overnight flags

    # Verify Dynamic Node Generation (High-Risk triggers Security Officer node)
    node_roles = [n["required_role"] for n in wf_data["nodes"]]
    assert "Faculty Advisor" in node_roles
    assert "Security Officer" in node_roles
    assert "Finance Officer" in node_roles
    assert "Admin" in node_roles
    assert len(wf_data["nodes"]) == 4

    # Verify Audit History log
    assert len(wf_data["history"]) >= 1
    assert wf_data["history"][0]["action_taken"] == "Initiated"


def test_node_rbac_enforcement_and_multi_tier_approval(client):
    admin_headers = get_auth_header(client, "admin_flow@university.edu", "Admin")
    organizer_headers = get_auth_header(client, "organizer_flow@university.edu", "Student Organizer")
    faculty_headers = get_auth_header(client, "faculty_flow@university.edu", "Faculty Advisor")
    security_headers = get_auth_header(client, "security_flow@university.edu", "Security Officer")
    finance_headers = get_auth_header(client, "finance_flow@university.edu", "Finance Officer")

    # 1. Create venue & proposal
    client.post("/api/v1/resources/", json={
        "name": "Central Auditorium",
        "type": "Venue",
        "capacity": 500,
        "location": "Main Campus",
        "status": "Available"
    }, headers=admin_headers)

    start_time = (datetime.now(timezone.utc) + timedelta(days=5)).replace(hour=9, minute=0, second=0)
    end_time = (start_time + timedelta(hours=6))

    draft_res = client.post("/api/v1/proposals/draft", json={
        "title": "Annual Research Symposium",
        "details": {
            "description": "Annual student symposium.",
            "objective": "Paper presentations.",
            "expected_participants": 200
        },
        "schedule": {
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "venue_preference": "Central Auditorium"
        }
    }, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    # 2. Initiate Workflow
    wf_res = client.post(f"/api/v1/approvals/initiate/{proposal_id}", headers=organizer_headers)
    wf_data = wf_res.json()
    nodes = wf_data["nodes"]
    node1_id = nodes[0]["id"]
    node2_id = nodes[1]["id"]

    # 3. RBAC TEST: Unauthorized user (Finance Officer) tries to review Step 1 (Faculty Advisor) -> 403 Forbidden
    res_wrong_role = client.post(f"/api/v1/approvals/nodes/{node1_id}/review", json={
        "decision": "Approved",
        "remarks": "Wrong role review attempt"
    }, headers=finance_headers)
    assert res_wrong_role.status_code == 403

    # 4. SEQUENCE TEST: Reviewing Step 2 while workflow is at Step 1 -> 400 Bad Request
    res_out_of_seq = client.post(f"/api/v1/approvals/nodes/{node2_id}/review", json={
        "decision": "Approved"
    }, headers=finance_headers)
    assert res_out_of_seq.status_code == 400

    # 5. Multi-Tier Sequential Approvals:
    # Step 1: Faculty Advisor approves
    res_step1 = client.post(f"/api/v1/approvals/nodes/{node1_id}/review", json={
        "decision": "Approved",
        "remarks": "Academic objectives and schedule verified."
    }, headers=faculty_headers)
    assert res_step1.status_code == 200
    assert res_step1.json()["current_step"] == 2

    # Step 2: Finance Officer approves
    res_step2 = client.post(f"/api/v1/approvals/nodes/{node2_id}/review", json={
        "decision": "Approved",
        "remarks": "Budget allocation compliant with university grant."
    }, headers=finance_headers)
    assert res_step2.status_code == 200
    assert res_step2.json()["current_step"] == 3

    # Step 3: Admin approves (Final Authority)
    node3_id = nodes[2]["id"]
    res_step3 = client.post(f"/api/v1/approvals/nodes/{node3_id}/review", json={
        "decision": "Approved",
        "remarks": "Final executive sanction granted."
    }, headers=admin_headers)
    assert res_step3.status_code == 200
    final_wf = res_step3.json()
    assert final_wf["status"] == "Approved"

    # Verify parent proposal status is now 'Approved'
    proposal_check = client.get(f"/api/v1/proposals/{proposal_id}", headers=organizer_headers)
    assert proposal_check.json()["status"] == "Approved"

    # Verify Immutable Audit Trail records all 4 actions
    assert len(final_wf["history"]) == 4
    actions = [h["action_taken"] for h in final_wf["history"]]
    assert actions == ["Initiated", "Approved", "Approved", "Approved"]


def test_workflow_rejection_halts_routing(client):
    admin_headers = get_auth_header(client, "admin_rej@university.edu", "Admin")
    organizer_headers = get_auth_header(client, "organizer_rej@university.edu", "Student Organizer")
    faculty_headers = get_auth_header(client, "faculty_rej@university.edu", "Faculty Advisor")

    draft_res = client.post("/api/v1/proposals/draft", json={"title": "Unprepared Event"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    wf_res = client.post(f"/api/v1/approvals/initiate/{proposal_id}", headers=organizer_headers)
    node1_id = wf_res.json()["nodes"][0]["id"]

    # Faculty Advisor rejects at Step 1
    rej_res = client.post(f"/api/v1/approvals/nodes/{node1_id}/review", json={
        "decision": "Rejected",
        "remarks": "Proposal lacks academic mentor support."
    }, headers=faculty_headers)
    assert rej_res.status_code == 200
    wf_data = rej_res.json()
    assert wf_data["status"] == "Rejected"

    # Verify parent proposal is Rejected
    proposal_check = client.get(f"/api/v1/proposals/{proposal_id}", headers=organizer_headers)
    assert proposal_check.json()["status"] == "Rejected"

    # Audit history reflects rejection
    assert wf_data["history"][-1]["action_taken"] == "Rejected"
    assert "lacks academic mentor support" in wf_data["history"][-1]["remarks"]
