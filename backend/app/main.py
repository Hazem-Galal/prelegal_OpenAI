from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager
from typing import AsyncIterator

import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app import db
from app.chat import ChatRequest, ChatResponse, run_chat_turn
from app.generic_chat import GenericChatRequest, GenericChatResponse, run_generic_chat_turn
from app.templates_catalog import (
    CatalogNotFoundError,
    TemplateNotFoundError,
    load_catalog,
    read_document_content,
)


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


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/documents")
def list_documents() -> dict:
    """Return the catalog of available legal documents and their fields."""
    try:
        return load_catalog()
    except CatalogNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/documents/{document_id}/content")
def get_document_content(document_id: str) -> dict:
    """Return the raw markdown template(s) for one document, by catalog id."""
    try:
        return read_document_content(document_id)
    except TemplateNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))


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


@app.post("/api/chat/generic", response_model=GenericChatResponse)
def chat_generic(request: GenericChatRequest) -> GenericChatResponse:
    return run_generic_chat_turn(request)
