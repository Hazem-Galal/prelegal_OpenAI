from __future__ import annotations

import json
import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app import db
from app.chat import ChatRequest, ChatResponse, run_chat_turn

# Project root is two levels up: backend/app/main.py -> prelegal/.
# Overridable via CATALOG_PATH so the container can point elsewhere.
ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = Path(os.environ.get("CATALOG_PATH", ROOT / "templates" / "templates.json"))


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    db.init_db()
    yield


app = FastAPI(title="Pre-Legal API", lifespan=lifespan)

# Prototype: allow the local frontend to call the API. Tighten before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_catalog() -> dict:
    if not CATALOG_PATH.exists():
        raise HTTPException(status_code=500, detail=f"Catalog not found at {CATALOG_PATH}")
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/documents")
def list_documents() -> dict:
    """Return the catalog of available legal documents and their fields."""
    return load_catalog()


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str


@app.post("/api/auth/signup", status_code=201, response_model=UserResponse)
def signup(request: AuthRequest) -> UserResponse:
    # EmailStr validates format but doesn't normalize casing, and SQLite's
    # UNIQUE constraint is case-sensitive, so lowercase before storing.
    email = request.email.lower()
    password_hash = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    try:
        user = db.create_user(email, password_hash)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    return UserResponse(id=user["id"], email=user["email"])


@app.post("/api/auth/signin", response_model=UserResponse)
def signin(request: AuthRequest) -> UserResponse:
    user = db.get_user_by_email(request.email.lower())
    if user is None or not bcrypt.checkpw(request.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return UserResponse(id=user["id"], email=user["email"])


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return run_chat_turn(request)
