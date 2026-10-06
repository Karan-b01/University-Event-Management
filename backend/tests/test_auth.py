import pytest
from app.main import app

def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_user_registration_and_profile(client):
    payload = {
        "name": "Jane Organizer",
        "email": "jane@university.edu",
        "password": "SecurePassword123!",
        "phone": "+1234567890",
        "address": "Campus Building B, Room 301",
        "role_name": "Student Organizer"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Organizer"
    assert data["email"] == "jane@university.edu"
    assert data["status"] is True
    assert len(data["roles"]) == 1
    assert data["roles"][0]["role_name"] == "Student Organizer"
    assert data["profile"] is not None
    assert data["profile"]["phone"] == "+1234567890"
    assert data["profile"]["address"] == "Campus Building B, Room 301"


def test_user_login_and_jwt_generation(client):
    # Register first
    reg_payload = {
        "name": "Faculty User",
        "email": "faculty@university.edu",
        "password": "FacultyPassword123!",
        "role_name": "Faculty Advisor"
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "faculty@university.edu",
        "password": "FacultyPassword123!",
        "captcha_token": "dummy_captcha_token"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "session_id" in data
    assert data["user"]["email"] == "faculty@university.edu"
    assert any(r["role_name"] == "Faculty Advisor" for r in data["user"]["roles"])


def test_rbac_access_control(client):
    # Register Student Organizer
    organizer_payload = {
        "name": "Organizer Bob",
        "email": "bob@university.edu",
        "password": "BobPassword123!",
        "role_name": "Student Organizer"
    }
    client.post("/api/v1/auth/register", json=organizer_payload)
    login_res = client.post("/api/v1/auth/login", json={
        "email": "bob@university.edu",
        "password": "BobPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Access Student Organizer area -> should succeed (200)
    res_org = client.get("/api/v1/users/student-organizer-area", headers=headers)
    assert res_org.status_code == 200

    # Access Finance Officer area -> should be forbidden (403)
    res_fin = client.get("/api/v1/users/finance-officer-area", headers=headers)
    assert res_fin.status_code == 403

    # Access Admin area -> should be forbidden (403)
    res_admin = client.get("/api/v1/users/admin-area", headers=headers)
    assert res_admin.status_code == 403


def test_session_invalidation_logout(client):
    reg_payload = {
        "name": "Test Logout User",
        "email": "logout@university.edu",
        "password": "LogoutPassword123!"
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    login_res = client.post("/api/v1/auth/login", json={
        "email": "logout@university.edu",
        "password": "LogoutPassword123!"
    })
    token_data = login_res.json()
    token = token_data["access_token"]
    session_id = token_data["session_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify access to /me before logout
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200

    # Logout
    logout_res = client.post(f"/api/v1/auth/logout?session_id={session_id}", headers=headers)
    assert logout_res.status_code == 200

    # Access /me after logout -> should be 401 Unauthorized because session is inactive
    me_after_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_after_res.status_code == 401


def test_duplicate_registration_fails(client):
    payload = {
        "name": "Duplicate User",
        "email": "dup@university.edu",
        "password": "Password123!"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_invalid_login_credentials(client):
    payload = {
        "email": "nonexistent@university.edu",
        "password": "WrongPassword"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 401


def test_gateways_invocations():
    from app.services.gateways import sms_gateway, captcha_service, email_gateway
    assert sms_gateway.send_otp("+1234567890", "123456") is True
    assert captcha_service.verify("valid_token") is True
    assert email_gateway.send_email("test@edu.com", "Subject", "Body") is True
