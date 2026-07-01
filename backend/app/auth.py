from __future__ import annotations

import sqlite3

from fastapi import HTTPException, Request

from app import db

SESSION_COOKIE_NAME = "session_id"


def get_current_user(request: Request) -> sqlite3.Row:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.get_user_by_session(session_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
