from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    from app import db, main

    # Point at a throwaway DB per test so tests never touch the real data file.
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture()
def authenticated_client(client):
    # TestClient persists cookies across requests within one instance, so the
    # session cookie set by signup carries into every subsequent call.
    client.post("/api/auth/signup", json={"email": "test-user@example.com", "password": "hunter2"})
    return client
