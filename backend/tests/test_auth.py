def test_signup_creates_user(client):
    response = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "hunter2"})

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "a@example.com"
    assert "id" in body


def test_signup_duplicate_email_is_rejected(client):
    client.post("/api/auth/signup", json={"email": "dup@example.com", "password": "hunter2"})

    response = client.post("/api/auth/signup", json={"email": "dup@example.com", "password": "other"})

    assert response.status_code == 409


def test_signup_duplicate_email_is_rejected_regardless_of_case(client):
    client.post("/api/auth/signup", json={"email": "dupcase@example.com", "password": "hunter2"})

    response = client.post("/api/auth/signup", json={"email": "DupCase@Example.com", "password": "other"})

    assert response.status_code == 409


def test_signin_is_case_insensitive_on_email(client):
    client.post("/api/auth/signup", json={"email": "case@example.com", "password": "hunter2"})

    response = client.post("/api/auth/signin", json={"email": "Case@Example.com", "password": "hunter2"})

    assert response.status_code == 200


def test_signin_with_correct_password_succeeds(client):
    client.post("/api/auth/signup", json={"email": "b@example.com", "password": "hunter2"})

    response = client.post("/api/auth/signin", json={"email": "b@example.com", "password": "hunter2"})

    assert response.status_code == 200
    assert response.json()["email"] == "b@example.com"


def test_signin_with_wrong_password_is_rejected(client):
    client.post("/api/auth/signup", json={"email": "c@example.com", "password": "hunter2"})

    response = client.post("/api/auth/signin", json={"email": "c@example.com", "password": "wrong"})

    assert response.status_code == 401


def test_signin_with_unknown_email_is_rejected(client):
    response = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "hunter2"})

    assert response.status_code == 401
