import io
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


def test_proposal_role_restriction(client):
    # Student role should NOT be able to access proposal draft endpoint
    student_headers = get_auth_header(client, "student@university.edu", "Student")
    res = client.post("/api/v1/proposals/draft", json={"title": "Unauthorized Proposal"}, headers=student_headers)
    assert res.status_code == 403

    # Student Organizer SHOULD be able to access proposal draft endpoint
    organizer_headers = get_auth_header(client, "organizer@university.edu", "Student Organizer")
    res_org = client.post("/api/v1/proposals/draft", json={"title": "Authorized Proposal"}, headers=organizer_headers)
    assert res_org.status_code == 201
    assert res_org.json()["status"] == "Draft"


def test_proposal_draft_partial_creation(client):
    organizer_headers = get_auth_header(client, "organizer2@university.edu", "Student Organizer")
    
    draft_payload = {
        "title": "Annual Tech Symposium 2026",
        "details": {
            "description": "A 2-day technical symposium for university students.",
            "objective": "Foster innovation and coding competitions.",
            "expected_participants": 250
        },
        "team_data": {
            "team_name": "ACM Student Chapter",
            "members": [
                {"name": "Alice Smith", "role": "Lead Coordinator"},
                {"name": "Bob Jones", "role": "Logistics Lead"}
            ]
        }
    }
    res = client.post("/api/v1/proposals/draft", json=draft_payload, headers=organizer_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Annual Tech Symposium 2026"
    assert data["status"] == "Draft"
    assert data["event_details"]["expected_participants"] == 250
    assert data["team_data"]["team_name"] == "ACM Student Chapter"
    assert len(data["team_data"]["members"]) == 2


def test_proposal_update_existing_record(client):
    organizer_headers = get_auth_header(client, "organizer3@university.edu", "Student Organizer")
    
    # 1. Create draft
    draft_res = client.post("/api/v1/proposals/draft", json={"title": "Draft Initial"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    # 2. Overwrite / Update existing proposal record
    start_time = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    end_time = (datetime.now(timezone.utc) + timedelta(days=12)).isoformat()

    update_payload = {
        "title": "Updated Hackathon 2026",
        "details": {
            "description": "Overnight 24-hour hackathon.",
            "objective": "Build working prototypes.",
            "expected_participants": 100
        },
        "schedule": {
            "start_date": start_time,
            "end_date": end_time,
            "venue_preference": "Main Auditorium"
        }
    }
    update_res = client.put(f"/api/v1/proposals/{proposal_id}", json=update_payload, headers=organizer_headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["id"] == proposal_id  # Same record ID maintained
    assert updated_data["title"] == "Updated Hackathon 2026"
    assert updated_data["event_details"]["expected_participants"] == 100
    assert updated_data["schedule"]["venue_preference"] == "Main Auditorium"


def test_document_upload_single_table_inheritance(client):
    organizer_headers = get_auth_header(client, "organizer4@university.edu", "Student Organizer")
    
    # Create draft
    draft_res = client.post("/api/v1/proposals/draft", json={"title": "Doc Test Proposal"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    # Upload Poster
    poster_file = io.BytesIO(b"fake image poster content")
    poster_res = client.post(
        f"/api/v1/proposals/{proposal_id}/documents",
        files={"file": ("event_poster.png", poster_file, "image/png")},
        data={"doc_type": "Poster"},
        headers=organizer_headers
    )
    assert poster_res.status_code == 201
    poster_data = poster_res.json()
    assert poster_data["type"] == "Poster"
    assert poster_data["file_name"] == "event_poster.png"

    # Upload Vendor Quotation
    quotation_file = io.BytesIO(b"fake pdf quotation content")
    quotation_res = client.post(
        f"/api/v1/proposals/{proposal_id}/documents",
        files={"file": ("sound_vendor_quote.pdf", quotation_file, "application/pdf")},
        data={"doc_type": "VendorQuotation"},
        headers=organizer_headers
    )
    assert quotation_res.status_code == 201
    quote_data = quotation_res.json()
    assert quote_data["type"] == "VendorQuotation"
    assert quote_data["file_name"] == "sound_vendor_quote.pdf"


def test_submit_proposal_validation_and_export(client):
    organizer_headers = get_auth_header(client, "organizer5@university.edu", "Student Organizer")
    
    # 1. Create partial draft
    draft_res = client.post("/api/v1/proposals/draft", json={"title": "Incomplete Proposal"}, headers=organizer_headers)
    proposal_id = draft_res.json()["id"]

    # 2. Attempt submit without details/schedule/documents -> Should Fail with 400
    submit_fail = client.post(f"/api/v1/proposals/{proposal_id}/submit", headers=organizer_headers)
    assert submit_fail.status_code == 400
    err_detail = submit_fail.json()["detail"]
    assert "errors" in err_detail
    assert len(err_detail["errors"]) >= 3

    # 3. Add complete Details and Schedule
    start_time = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    end_time = (datetime.now(timezone.utc) + timedelta(days=6)).isoformat()

    client.put(
        f"/api/v1/proposals/{proposal_id}",
        json={
            "details": {
                "description": "Full conference on AI ethics.",
                "objective": "Educate students on ethical AI.",
                "expected_participants": 150
            },
            "schedule": {
                "start_date": start_time,
                "end_date": end_time,
                "venue_preference": "Conference Hall C"
            },
            "team_data": {
                "team_name": "AI Society",
                "members": [{"name": "Charlie", "role": "President"}]
            }
        },
        headers=organizer_headers
    )

    # 4. Upload at least one document
    doc_file = io.BytesIO(b"Poster content")
    client.post(
        f"/api/v1/proposals/{proposal_id}/documents",
        files={"file": ("ai_poster.jpg", doc_file, "image/jpeg")},
        data={"doc_type": "Poster"},
        headers=organizer_headers
    )

    # 5. Submit again -> Should succeed and change status to 'Submitted'
    submit_success = client.post(f"/api/v1/proposals/{proposal_id}/submit", headers=organizer_headers)
    assert submit_success.status_code == 200
    assert submit_success.json()["status"] == "Submitted"

    # 6. Test ExportManager simulation (GET /export)
    export_res = client.get(f"/api/v1/proposals/{proposal_id}/export", headers=organizer_headers)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["proposal_id"] == proposal_id
    assert export_data["status"] == "Submitted"
    assert export_data["details"]["expected_participants"] == 150
    assert export_data["schedule"]["venue_preference"] == "Conference Hall C"
    assert len(export_data["attached_documents"]) == 1
    assert export_data["attached_documents"][0]["file_name"] == "ai_poster.jpg"
    assert "exported_at" in export_data

