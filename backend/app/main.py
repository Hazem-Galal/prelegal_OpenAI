from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Project root is two levels up: backend/app/main.py -> prelegal/.
# Overridable via CATALOG_PATH so the container can point elsewhere.
ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = Path(os.environ.get("CATALOG_PATH", ROOT / "templates" / "templates.json"))

app = FastAPI(title="Pre-Legal API")

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


# NOTE: The chat endpoint that drives field extraction is a Jira feature.
# When you build it, call the LLM via the `openai-llm` skill (gpt-4.1 + structured outputs).
