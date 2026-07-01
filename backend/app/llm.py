from __future__ import annotations

import os
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel

CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4.1")
EXTRACTION_MODEL = os.environ.get("OPENAI_EXTRACTION_MODEL", "gpt-4.1-mini")

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


def to_openai_messages(system_prompt: str, messages: list[ChatMessage]) -> list[dict]:
    return [{"role": "system", "content": system_prompt}] + [
        {"role": message.role, "content": message.content} for message in messages
    ]


def reply(system_prompt: str, messages: list[ChatMessage]) -> str:
    response = get_client().responses.create(
        model=CHAT_MODEL,
        input=to_openai_messages(system_prompt, messages),
    )
    return response.output_text


def extract(system_prompt: str, messages: list[ChatMessage], schema: type[BaseModel]) -> BaseModel:
    response = get_client().responses.parse(
        model=EXTRACTION_MODEL,
        input=to_openai_messages(system_prompt, messages),
        text_format=schema,
    )
    return response.output_parsed
