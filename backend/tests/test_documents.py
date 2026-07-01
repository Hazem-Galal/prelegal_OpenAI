from __future__ import annotations

import uuid


def test_save_requires_authentication(client):
    response = client.put(
        "/api/documents/save",
        json={"documentId": str(uuid.uuid4()), "documentTypeId": "mutual-nda", "fieldValues": {}},
    )

    assert response.status_code == 401


def test_list_requires_authentication(client):
    response = client.get("/api/documents/mine")

    assert response.status_code == 401


def test_get_one_requires_authentication(client):
    response = client.get(f"/api/documents/mine/{uuid.uuid4()}")

    assert response.status_code == 401


def test_save_then_list_then_get_round_trip(authenticated_client):
    document_id = str(uuid.uuid4())
    field_values = {"party1Name": "Alice", "party2Name": "Bob"}

    save_response = authenticated_client.put(
        "/api/documents/save",
        json={"documentId": document_id, "documentTypeId": "mutual-nda", "fieldValues": field_values},
    )
    list_response = authenticated_client.get("/api/documents/mine")
    get_response = authenticated_client.get(f"/api/documents/mine/{document_id}")

    assert save_response.status_code == 200
    assert any(item["id"] == document_id for item in list_response.json())
    assert get_response.status_code == 200
    body = get_response.json()
    assert body["documentTypeId"] == "mutual-nda"
    assert body["fieldValues"] == field_values


def test_saving_again_with_same_id_updates_in_place(authenticated_client):
    document_id = str(uuid.uuid4())
    authenticated_client.put(
        "/api/documents/save",
        json={"documentId": document_id, "documentTypeId": "mutual-nda", "fieldValues": {"party1Name": "Alice"}},
    )
    authenticated_client.put(
        "/api/documents/save",
        json={"documentId": document_id, "documentTypeId": "mutual-nda", "fieldValues": {"party1Name": "Alicia"}},
    )

    list_response = authenticated_client.get("/api/documents/mine")
    matching = [item for item in list_response.json() if item["id"] == document_id]

    assert len(matching) == 1
    get_response = authenticated_client.get(f"/api/documents/mine/{document_id}")
    assert get_response.json()["fieldValues"]["party1Name"] == "Alicia"


def test_get_document_owned_by_another_user_is_not_found(client):
    document_id = str(uuid.uuid4())

    client.post("/api/auth/signup", json={"email": "owner@example.com", "password": "hunter2"})
    client.put(
        "/api/documents/save",
        json={"documentId": document_id, "documentTypeId": "mutual-nda", "fieldValues": {"party1Name": "Alice"}},
    )
    client.post("/api/auth/signout")

    client.post("/api/auth/signup", json={"email": "other@example.com", "password": "hunter2"})
    response = client.get(f"/api/documents/mine/{document_id}")

    assert response.status_code == 404


def test_list_is_scoped_to_the_calling_user(client):
    client.post("/api/auth/signup", json={"email": "owner2@example.com", "password": "hunter2"})
    client.put(
        "/api/documents/save",
        json={"documentId": str(uuid.uuid4()), "documentTypeId": "mutual-nda", "fieldValues": {}},
    )
    client.post("/api/auth/signout")

    client.post("/api/auth/signup", json={"email": "other2@example.com", "password": "hunter2"})
    response = client.get("/api/documents/mine")

    assert response.json() == []
