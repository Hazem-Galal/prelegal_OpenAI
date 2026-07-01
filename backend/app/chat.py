from __future__ import annotations

import os
from typing import Literal, Optional

from openai import OpenAI
from pydantic import BaseModel

CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4.1")
EXTRACTION_MODEL = os.environ.get("OPENAI_EXTRACTION_MODEL", "gpt-4.1-mini")

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


# Field names mirror `MndaFormValues` in frontend/lib/mnda.ts exactly, so the
# frontend can merge this object straight into its form state with no translation.
class MndaFields(BaseModel):
    party1Name: Optional[str] = None
    party1Company: Optional[str] = None
    party1Title: Optional[str] = None
    party1NoticeAddress: Optional[str] = None
    party2Name: Optional[str] = None
    party2Company: Optional[str] = None
    party2Title: Optional[str] = None
    party2NoticeAddress: Optional[str] = None
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None  # ISO 8601 (YYYY-MM-DD)
    mndaTermType: Optional[Literal["expires", "continues"]] = None
    mndaTermYears: Optional[int] = None
    confidentialityTermType: Optional[Literal["duration", "perpetuity"]] = None
    confidentialityTermYears: Optional[int] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    fields: MndaFields


CHAT_SYSTEM_PROMPT = """You are a legal assistant helping a user fill out a Common \
Paper Mutual Non-Disclosure Agreement (MNDA) through conversation. Ask about one or \
two related fields at a time, in a natural order: the two parties (name, company, \
title, notice address), the purpose of the disclosure, the effective date, the MNDA \
term (expires after N years, or continues until terminated), the confidentiality \
term (duration in years, or perpetuity), and governing law/jurisdiction. Confirm \
values back to the user when helpful, and let them correct anything by just telling \
you the change. Keep replies short and conversational."""

EXTRACTION_SYSTEM_PROMPT = """Extract the Mutual NDA field values established so far \
in this conversation. Only fill in a field once the user has actually stated it; \
leave anything not yet discussed as null."""


def _to_openai_messages(system_prompt: str, messages: list[ChatMessage]) -> list[dict]:
    return [{"role": "system", "content": system_prompt}] + [
        {"role": message.role, "content": message.content} for message in messages
    ]


def _reply(messages: list[ChatMessage]) -> str:
    response = _get_client().responses.create(
        model=CHAT_MODEL,
        input=_to_openai_messages(CHAT_SYSTEM_PROMPT, messages),
    )
    return response.output_text


def _extract_fields(messages: list[ChatMessage]) -> MndaFields:
    response = _get_client().responses.parse(
        model=EXTRACTION_MODEL,
        input=_to_openai_messages(EXTRACTION_SYSTEM_PROMPT, messages),
        text_format=MndaFields,
    )
    return response.output_parsed


def run_chat_turn(request: ChatRequest) -> ChatResponse:
    reply_text = _reply(request.messages)
    conversation_with_reply = request.messages + [
        ChatMessage(role="assistant", content=reply_text)
    ]
    fields = _extract_fields(conversation_with_reply)
    return ChatResponse(reply=reply_text, fields=fields)
