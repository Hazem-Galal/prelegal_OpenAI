from __future__ import annotations

from types import SimpleNamespace

import pytest

from app import chat, llm


class FakeResponses:
    def __init__(self, reply_text: str, parsed_fields: chat.MndaFields):
        self._reply_text = reply_text
        self._parsed_fields = parsed_fields

    def create(self, model: str, input: list[dict]) -> SimpleNamespace:
        return SimpleNamespace(output_text=self._reply_text)

    def parse(self, model: str, input: list[dict], text_format: type) -> SimpleNamespace:
        return SimpleNamespace(output_parsed=self._parsed_fields)


class FakeClient:
    def __init__(self, reply_text: str, parsed_fields: chat.MndaFields):
        self.responses = FakeResponses(reply_text, parsed_fields)


@pytest.fixture()
def fake_llm(monkeypatch):
    def install(reply_text: str, parsed_fields: chat.MndaFields) -> None:
        monkeypatch.setattr(llm, "get_client", lambda: FakeClient(reply_text, parsed_fields))

    return install


def test_chat_endpoint_returns_reply_and_fields(authenticated_client, fake_llm):
    fake_llm(
        "Nice to meet you both. What's the purpose of sharing confidential information?",
        chat.MndaFields(party1Name="Alice", party2Name="Bob"),
    )

    response = authenticated_client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "I'm Alice, working with Bob"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"].startswith("Nice to meet you both")
    assert body["fields"]["party1Name"] == "Alice"
    assert body["fields"]["party2Name"] == "Bob"


def test_chat_endpoint_leaves_unmentioned_fields_null(authenticated_client, fake_llm):
    fake_llm("Got it, thanks!", chat.MndaFields(purpose="Evaluating a partnership"))

    response = authenticated_client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "We're evaluating a partnership"}]},
    )

    body = response.json()
    assert body["fields"]["purpose"] == "Evaluating a partnership"
    assert body["fields"]["party1Name"] is None
    assert body["fields"]["governingLaw"] is None


def test_chat_endpoint_requires_authentication(client):
    response = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert response.status_code == 401


def test_run_chat_turn_sends_reply_as_context_for_extraction(fake_llm):
    fake_llm("What's the effective date?", chat.MndaFields())

    result = chat.run_chat_turn(
        chat.ChatRequest(messages=[chat.ChatMessage(role="user", content="Delaware law")])
    )

    assert result.reply == "What's the effective date?"
    assert result.fields == chat.MndaFields()
