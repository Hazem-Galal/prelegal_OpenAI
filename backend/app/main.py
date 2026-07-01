from __future__ import annotations

import json
import os
import secrets
import sqlite3
from contextlib import asynccontextmanager
from typing import AsyncIterator

import bcrypt
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app import db
from app.auth import SESSION_COOKIE_NAME, get_current_user
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
# Cookie-based auth requires an explicit origin (not "*") plus allow_credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
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


def _start_session(response: Response, user_id: int) -> None:
    session_id = secrets.token_urlsafe(32)
    db.create_session(session_id, user_id)
    # secure=False is a local-dev-only limitation (plain http://localhost);
    # tighten (secure=True, real HTTPS) before any production deployment.
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_id,
        httponly=True,
        samesite="lax",
        secure=False,
    )


@app.post("/api/auth/signup", status_code=201, response_model=UserResponse)
def signup(request: AuthRequest, response: Response) -> UserResponse:
    # EmailStr validates format but doesn't normalize casing, and SQLite's
    # UNIQUE constraint is case-sensitive, so lowercase before storing.
    email = request.email.lower()
    password_hash = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    try:
        user = db.create_user(email, password_hash)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    _start_session(response, user["id"])
    return UserResponse(id=user["id"], email=user["email"])


@app.post("/api/auth/signin", response_model=UserResponse)
def signin(request: AuthRequest, response: Response) -> UserResponse:
    user = db.get_user_by_email(request.email.lower())
    if user is None or not bcrypt.checkpw(request.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _start_session(response, user["id"])
    return UserResponse(id=user["id"], email=user["email"])


@app.post("/api/auth/signout")
def signout(request: Request, response: Response) -> dict:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id is not None:
        db.delete_session(session_id)
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"status": "ok"}


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: sqlite3.Row = Depends(get_current_user)) -> UserResponse:
    return UserResponse(id=current_user["id"], email=current_user["email"])


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest, current_user: sqlite3.Row = Depends(get_current_user)) -> ChatResponse:
    return run_chat_turn(request)


@app.post("/api/chat/generic", response_model=GenericChatResponse)
def chat_generic(
    request: GenericChatRequest, current_user: sqlite3.Row = Depends(get_current_user)
) -> GenericChatResponse:
    return run_generic_chat_turn(request)


class SaveDocumentRequest(BaseModel):
    documentId: str
    documentTypeId: str
    fieldValues: dict


class SavedDocumentSummary(BaseModel):
    id: str
    documentTypeId: str
    updatedAt: str


class SavedDocument(BaseModel):
    id: str
    documentTypeId: str
    fieldValues: dict
    updatedAt: str


@app.put("/api/documents/save")
def save_document(request: SaveDocumentRequest, current_user: sqlite3.Row = Depends(get_current_user)) -> dict:
    db.upsert_document(request.documentId, current_user["id"], request.documentTypeId, request.fieldValues)
    return {"status": "ok"}


@app.get("/api/documents/mine", response_model=list[SavedDocumentSummary])
def list_my_documents(current_user: sqlite3.Row = Depends(get_current_user)) -> list[SavedDocumentSummary]:
    rows = db.list_documents_for_user(current_user["id"])
    return [
        SavedDocumentSummary(id=row["id"], documentTypeId=row["document_type_id"], updatedAt=row["updated_at"])
        for row in rows
    ]


@app.get("/api/documents/mine/{document_id}", response_model=SavedDocument)
def get_my_document(document_id: str, current_user: sqlite3.Row = Depends(get_current_user)) -> SavedDocument:
    row = db.get_document(document_id, current_user["id"])
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return SavedDocument(
        id=row["id"],
        documentTypeId=row["document_type_id"],
        fieldValues=json.loads(row["field_values_json"]),
        updatedAt=row["updated_at"],
    )
