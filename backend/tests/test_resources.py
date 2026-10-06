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


def test_resource_creation_and_listing(client):
    admin_headers = get_auth_header(client, "admin_resource@university.edu", "Admin")

    # Create Venue
    venue_payload = {
        "name": "Main Auditorium",
        "type": "Venue",
        "capacity": 500,
        "location": "North Campus Building A",
        "status": "Available"
    }
    res_venue = client.post("/api/v1/resources/", json=venue_payload, headers=admin_headers)
    assert res_venue.status_code == 201
    venue_data = res_venue.json()
    assert venue_data["name"] == "Main Auditorium"
    assert venue_data["type"] == "Venue"
    assert venue_data["capacity"] == 500

    # Create Equipment
    equip_payload = {
        "name": "Line Array Sound System",
        "type": "Equipment",
        "equipment_type": "Audio",
        "condition": "Excellent",
        "status": "Available"
    }
    res_equip = client.post("/api/v1/resources/", json=equip_payload, headers=admin_headers)
    assert res_equip.status_code == 201
    equip_data = res_equip.json()
    assert equip_data["name"] == "Line Array Sound System"
    assert equip_data["type"] == "Equipment"

    # List all resources
    res_list = client.get("/api/v1/resources/")
    assert res_list.status_code == 200
    all_res = res_list.json()
    assert len(all_res) >= 2


def test_resource_booking_and_overlap_concurrency_prevention(client):
    """
    CRITICAL TEST: Simulates booking reservations and verifies strict
    409 Conflict rejection for all overlapping time intervals.
    """
    admin_headers = get_auth_header(client, "admin_book@university.edu", "Admin")
    organizer_headers = get_auth_header(client, "organizer_book@university.edu", "Student Organizer")
    other_organizer_headers = get_auth_header(client, "organizer_compete@university.edu", "Student Organizer")

    # 1. Create a venue resource
    venue_res = client.post("/api/v1/resources/", json={
        "name": "Convention Center Hall 1",
        "type": "Venue",
        "capacity": 300,
        "location": "Central Campus",
        "status": "Available"
    }, headers=admin_headers)
    resource_id = venue_res.json()["id"]

    # Base booking window: Tomorrow 10:00 to 14:00 UTC
    base_time = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(days=1)
    slot_10_00 = base_time.replace(hour=10, minute=0, second=0)
    slot_14_00 = base_time.replace(hour=14, minute=0, second=0)

    # 2. Organizer 1 books 10:00 -> 14:00 (Should Succeed)
    booking_payload = {
        "resource_id": resource_id,
        "start_time": slot_10_00.isoformat(),
        "end_time": slot_14_00.isoformat()
    }
    res_booking1 = client.post("/api/v1/resources/book", json=booking_payload, headers=organizer_headers)
    assert res_booking1.status_code == 201
    booking1_data = res_booking1.json()
    assert booking1_data["status"] == "Confirmed"
    assert booking1_data["resource_id"] == resource_id

    # 3. Competing Organizer attempts EXACT overlap: 10:00 -> 14:00 (Must Fail with 409 Conflict)
    res_exact_overlap = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": slot_10_00.isoformat(),
        "end_time": slot_14_00.isoformat()
    }, headers=other_organizer_headers)
    assert res_exact_overlap.status_code == 409
    assert "already booked" in res_exact_overlap.json()["detail"]

    # 4. Competing Organizer attempts ENCOMPASSING overlap: 09:00 -> 15:00 (Must Fail with 409 Conflict)
    slot_09_00 = base_time.replace(hour=9, minute=0, second=0)
    slot_15_00 = base_time.replace(hour=15, minute=0, second=0)
    res_encompassing = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": slot_09_00.isoformat(),
        "end_time": slot_15_00.isoformat()
    }, headers=other_organizer_headers)
    assert res_encompassing.status_code == 409

    # 5. Competing Organizer attempts PARTIAL START overlap: 09:00 -> 11:00 (Must Fail with 409 Conflict)
    slot_11_00 = base_time.replace(hour=11, minute=0, second=0)
    res_start_overlap = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": slot_09_00.isoformat(),
        "end_time": slot_11_00.isoformat()
    }, headers=other_organizer_headers)
    assert res_start_overlap.status_code == 409

    # 6. Competing Organizer attempts PARTIAL END overlap: 13:00 -> 16:00 (Must Fail with 409 Conflict)
    slot_13_00 = base_time.replace(hour=13, minute=0, second=0)
    slot_16_00 = base_time.replace(hour=16, minute=0, second=0)
    res_end_overlap = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": slot_13_00.isoformat(),
        "end_time": slot_16_00.isoformat()
    }, headers=other_organizer_headers)
    assert res_end_overlap.status_code == 409

    # 7. Non-overlapping BEFORE: 08:00 -> 10:00 (Should Succeed with 201)
    slot_08_00 = base_time.replace(hour=8, minute=0, second=0)
    res_before = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": slot_08_00.isoformat(),
        "end_time": slot_10_00.isoformat()
    }, headers=other_organizer_headers)
    assert res_before.status_code == 201

    # 8. Non-overlapping AFTER: 14:00 -> 16:00 (Should Succeed with 201)
    res_after = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": slot_14_00.isoformat(),
        "end_time": slot_16_00.isoformat()
    }, headers=other_organizer_headers)
    assert res_after.status_code == 201


def test_booking_cancellation_and_reslotting(client):
    admin_headers = get_auth_header(client, "admin_cancel@university.edu", "Admin")
    organizer_headers = get_auth_header(client, "organizer_cancel@university.edu", "Student Organizer")

    # Create transport resource
    trans_res = client.post("/api/v1/resources/", json={
        "name": "Campus Shuttle Bus 01",
        "type": "Transport",
        "vehicle_no": "UNIV-BUS-101",
        "driver": "John Doe",
        "status": "Available"
    }, headers=admin_headers)
    resource_id = trans_res.json()["id"]

    base_time = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(days=2)
    start_time = base_time.replace(hour=10, minute=0, second=0)
    end_time = base_time.replace(hour=12, minute=0, second=0)

    # Book slot
    book_res = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }, headers=organizer_headers)
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    # Cancel booking
    cancel_res = client.post(f"/api/v1/resources/bookings/{booking_id}/cancel", headers=organizer_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "Cancelled"

    # Now booking the exact same time slot should succeed since the prior booking is Cancelled
    rebook_res = client.post("/api/v1/resources/book", json={
        "resource_id": resource_id,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }, headers=organizer_headers)
    assert rebook_res.status_code == 201
    assert rebook_res.json()["status"] == "Confirmed"


def test_damage_report_submission(client):
    admin_headers = get_auth_header(client, "admin_damage@university.edu", "Admin")
    organizer_headers = get_auth_header(client, "organizer_damage@university.edu", "Student Organizer")

    # Create equipment
    equip_res = client.post("/api/v1/resources/", json={
        "name": "Stage Projector 4K",
        "type": "Equipment",
        "equipment_type": "Video",
        "condition": "Good",
        "status": "Available"
    }, headers=admin_headers)
    resource_id = equip_res.json()["id"]

    # Submit damage report
    damage_payload = {
        "description": "HDMI port damaged during conference tear-down.",
        "image_path": "/uploads/damage/projector_hdmi.jpg",
        "estimated_cost": 150.0
    }
    report_res = client.post(f"/api/v1/resources/{resource_id}/damage", json=damage_payload, headers=organizer_headers)
    assert report_res.status_code == 201
    data = report_res.json()
    assert data["resource_id"] == resource_id
    assert data["description"] == "HDMI port damaged during conference tear-down."
    assert data["estimated_cost"] == 150.0
    assert "report_date" in data

