from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

from app.llm import ChatMessage, extract, reply


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


def _reply(messages: list[ChatMessage]) -> str:
    return reply(CHAT_SYSTEM_PROMPT, messages)


def _extract_fields(messages: list[ChatMessage]) -> MndaFields:
    return extract(EXTRACTION_SYSTEM_PROMPT, messages, MndaFields)


def run_chat_turn(request: ChatRequest) -> ChatResponse:
    reply_text = _reply(request.messages)
    conversation_with_reply = request.messages + [
        ChatMessage(role="assistant", content=reply_text)
    ]
    fields = _extract_fields(conversation_with_reply)
    return ChatResponse(reply=reply_text, fields=fields)
