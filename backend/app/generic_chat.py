from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from app.fields import build_extraction_model, extract_field_variables, fields_to_labeled_dict
from app.llm import ChatMessage, extract, reply
from app.templates_catalog import (
    TemplateNotFoundError,
    get_template_meta,
    load_catalog,
    read_template_file,
)


class GenericChatRequest(BaseModel):
    documentId: Optional[str] = None
    messages: list[ChatMessage]


class GenericChatResponse(BaseModel):
    documentId: Optional[str] = None
    reply: str
    fields: dict[str, Optional[str]] = {}


class DocumentSelection(BaseModel):
    documentId: Optional[str] = None


SELECTION_SYSTEM_PROMPT_TEMPLATE = """You are a legal assistant helping a user figure out \
which legal document template they need. Here is the catalog of available documents:

{catalog}

Ask the user what kind of agreement they need if it's not yet clear. Match their \
free-text description against the catalog above. If they want something not in the \
catalog, say so clearly and suggest the closest available document by name, but do \
not silently substitute it — wait for them to confirm. Keep replies short and \
conversational."""

SELECTION_EXTRACTION_PROMPT = """Based on the conversation, has the user clearly \
confirmed which catalog document they want? If yes, return its exact catalog id. \
If not yet confirmed (still discussing, or they haven't responded to a suggestion \
yet), return null."""

FIELD_COLLECTION_SYSTEM_PROMPT_TEMPLATE = """You are a legal assistant helping a user \
fill out a {name} through conversation. Ask about the following fields naturally, a \
couple at a time, in the order given: {fields}. Confirm values back to the user when \
helpful, and let them correct anything by just telling you the change. Keep replies \
short and conversational."""

FIELD_EXTRACTION_SYSTEM_PROMPT = """Extract the field values established so far in \
this conversation. Only fill in a field once the user has actually stated it; leave \
anything not yet discussed as null."""


def _catalog_context() -> str:
    catalog = load_catalog()
    return "\n".join(
        f"- id: {template['id']}, name: {template['name']}, description: {template['description']}"
        for template in catalog["templates"]
    )


def _run_document_selection_turn(request: GenericChatRequest) -> GenericChatResponse:
    catalog = load_catalog()
    valid_ids = {template["id"] for template in catalog["templates"]}
    system_prompt = SELECTION_SYSTEM_PROMPT_TEMPLATE.format(catalog=_catalog_context())

    reply_text = reply(system_prompt, request.messages)
    conversation_with_reply = request.messages + [ChatMessage(role="assistant", content=reply_text)]
    selection = extract(SELECTION_EXTRACTION_PROMPT, conversation_with_reply, DocumentSelection)

    document_id = selection.documentId
    if document_id is not None and document_id not in valid_ids:
        document_id = None  # guard against a hallucinated id

    return GenericChatResponse(documentId=document_id, reply=reply_text, fields={})


def _run_field_collection_turn(request: GenericChatRequest) -> GenericChatResponse:
    document_id = request.documentId
    meta = get_template_meta(document_id)
    template_text = read_template_file(meta["files"]["standardTerms"])
    variable_names = extract_field_variables(template_text)
    fields_model, slug_to_label = build_extraction_model(document_id, variable_names)

    system_prompt = FIELD_COLLECTION_SYSTEM_PROMPT_TEMPLATE.format(
        name=meta["name"], fields=", ".join(variable_names)
    )
    reply_text = reply(system_prompt, request.messages)
    conversation_with_reply = request.messages + [ChatMessage(role="assistant", content=reply_text)]
    fields_instance = extract(FIELD_EXTRACTION_SYSTEM_PROMPT, conversation_with_reply, fields_model)

    return GenericChatResponse(
        documentId=document_id,
        reply=reply_text,
        fields=fields_to_labeled_dict(fields_instance, slug_to_label),
    )


def run_generic_chat_turn(request: GenericChatRequest) -> GenericChatResponse:
    if request.documentId is None:
        return _run_document_selection_turn(request)
    try:
        return _run_field_collection_turn(request)
    except TemplateNotFoundError:
        # Frontend sent a stale/unknown id; fall back to re-selecting a document.
        return _run_document_selection_turn(GenericChatRequest(documentId=None, messages=request.messages))
