from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

# Project root is two levels up: backend/app/db.py -> prelegal/.
ROOT = Path(__file__).resolve().parents[2]

# Temporary database: recreated from scratch on every startup (see init_db),
# so DB_PATH just needs to point somewhere writable inside the container.
DB_PATH = Path(os.environ.get("DB_PATH", ROOT / "data" / "prelegal.db"))


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    """Recreate the schema from scratch. Called on every app startup so the
    database always starts empty, matching the technical design's "temporary
    database" requirement."""
    with get_connection() as connection:
        connection.execute("DROP TABLE IF EXISTS documents")
        connection.execute("DROP TABLE IF EXISTS sessions")
        connection.execute("DROP TABLE IF EXISTS users")
        connection.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE documents (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                document_type_id TEXT NOT NULL,
                field_values_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def create_user(email: str, password_hash: str) -> sqlite3.Row:
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, password_hash),
        )
        return connection.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()


def get_user_by_email(email: str) -> sqlite3.Row | None:
    with get_connection() as connection:
        return connection.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (email,),
        ).fetchone()


def create_session(session_id: str, user_id: int) -> None:
    with get_connection() as connection:
        connection.execute(
            "INSERT INTO sessions (id, user_id) VALUES (?, ?)",
            (session_id, user_id),
        )


def get_user_by_session(session_id: str) -> sqlite3.Row | None:
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT users.id, users.email, users.created_at
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.id = ?
            """,
            (session_id,),
        ).fetchone()


def delete_session(session_id: str) -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM sessions WHERE id = ?", (session_id,))


def upsert_document(document_id: str, user_id: int, document_type_id: str, field_values: dict) -> None:
    with get_connection() as connection:
        # The WHERE clause on the UPDATE arm ensures a document_id collision can
        # never let one user overwrite another user's row (a no-op instead).
        connection.execute(
            """
            INSERT INTO documents (id, user_id, document_type_id, field_values_json)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                field_values_json = excluded.field_values_json,
                updated_at = CURRENT_TIMESTAMP
            WHERE documents.user_id = excluded.user_id
            """,
            (document_id, user_id, document_type_id, json.dumps(field_values)),
        )


def list_documents_for_user(user_id: int) -> list[sqlite3.Row]:
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT id, document_type_id, updated_at
            FROM documents
            WHERE user_id = ?
            ORDER BY updated_at DESC
            """,
            (user_id,),
        ).fetchall()


def get_document(document_id: str, user_id: int) -> sqlite3.Row | None:
    with get_connection() as connection:
        return connection.execute(
            """
            SELECT id, document_type_id, field_values_json, updated_at
            FROM documents
            WHERE id = ? AND user_id = ?
            """,
            (document_id, user_id),
        ).fetchone()
