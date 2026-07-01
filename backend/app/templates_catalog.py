from __future__ import annotations

import json
import os
from pathlib import Path

from app.fields import extract_field_variables

# Project root is two levels up: backend/app/templates_catalog.py -> prelegal/.
# Overridable via CATALOG_PATH so the container can point elsewhere.
ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = Path(os.environ.get("CATALOG_PATH", ROOT / "templates" / "templates.json"))


class CatalogNotFoundError(Exception):
    pass


class TemplateNotFoundError(Exception):
    pass


def load_catalog() -> dict:
    if not CATALOG_PATH.exists():
        raise CatalogNotFoundError(f"Catalog not found at {CATALOG_PATH}")
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def get_template_meta(document_id: str) -> dict:
    for template in load_catalog()["templates"]:
        if template["id"] == document_id:
            return template
    raise TemplateNotFoundError(f"No template with id {document_id!r}")


def read_template_file(relative_path: str) -> str:
    return (ROOT / "templates" / relative_path).read_text(encoding="utf-8")


def read_document_content(document_id: str) -> dict:
    """Return a document's display name, raw markdown file(s), and fill-in field names."""
    meta = get_template_meta(document_id)
    files = meta["files"]
    standard_terms = read_template_file(files["standardTerms"])
    return {
        "name": meta["name"],
        "standardTerms": standard_terms,
        "coverPage": read_template_file(files["coverPage"]) if "coverPage" in files else None,
        "fields": extract_field_variables(standard_terms),
    }
