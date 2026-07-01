from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, create_model

# Matches any `<span ...>text</span>` tag; the attributes group is checked
# separately for a `class="..._link"` so attribute order doesn't matter.
_SPAN_RE = re.compile(r"<span\s+([^>]*)>([^<]*)</span>")
_LINK_CLASS_RE = re.compile(r'class="(\w+_link)"')


def extract_field_variables(markdown: str) -> list[str]:
    """Returns the deduplicated, first-seen-order list of fill-in variable names.

    A variable is any `<span class="X_link">Variable Text</span>` tag, where X
    varies per template (coverpage_link, keyterms_link, orderform_link, etc.) —
    matching on the `_link` suffix means new templates need no new code here.
    Structural spans like `header_2`/`header_3` don't end in `_link` and are
    excluded automatically.
    """
    seen: set[str] = set()
    ordered: list[str] = []
    for attrs, text in _SPAN_RE.findall(markdown):
        if not _LINK_CLASS_RE.search(attrs):
            continue
        label = text.strip()
        if label and label not in seen:
            seen.add(label)
            ordered.append(label)
    return ordered


def _slugify(label: str) -> str:
    slug = re.sub(r"[^0-9a-zA-Z]+", "_", label).strip("_").lower()
    if not slug:
        slug = "field"
    if slug[0].isdigit():
        slug = f"f_{slug}"
    return slug


def build_extraction_model(document_id: str, variable_names: list[str]) -> tuple[type[BaseModel], dict[str, str]]:
    """Builds a runtime Pydantic model with one Optional[str] field per variable.

    Returns the model alongside a `{slug: original variable label}` map, since
    variable text (e.g. "Effective Date") isn't a valid Python identifier and
    the wire format should use the original label, not the slug.
    """
    slug_to_label: dict[str, str] = {}
    field_definitions: dict[str, tuple] = {}
    used_slugs: set[str] = set()

    for label in variable_names:
        base_slug = _slugify(label)
        slug = base_slug
        suffix = 2
        while slug in used_slugs:
            slug = f"{base_slug}_{suffix}"
            suffix += 1
        used_slugs.add(slug)
        slug_to_label[slug] = label
        field_definitions[slug] = (Optional[str], None)

    model_name = f"{_slugify(document_id).title().replace('_', '')}Fields"
    model = create_model(model_name, **field_definitions)
    return model, slug_to_label


def fields_to_labeled_dict(fields_instance: BaseModel, slug_to_label: dict[str, str]) -> dict[str, Optional[str]]:
    dumped = fields_instance.model_dump()
    return {label: dumped.get(slug) for slug, label in slug_to_label.items()}
