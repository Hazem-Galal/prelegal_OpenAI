from __future__ import annotations

from types import SimpleNamespace

import pytest

from app import llm
from app.fields import build_extraction_model, extract_field_variables
from app.generic_chat import ChatMessage, DocumentSelection, GenericChatRequest, run_generic_chat_turn
from app.templates_catalog import get_template_meta, read_template_file


class FakeResponses:
    def __init__(self, reply_text, parsed):
        self._reply_text = reply_text
        self._parsed = parsed

    def create(self, model: str, input: list[dict]) -> SimpleNamespace:
        return SimpleNamespace(output_text=self._reply_text)

    def parse(self, model: str, input: list[dict], text_format: type) -> SimpleNamespace:
        return SimpleNamespace(output_parsed=self._parsed)


class FakeClient:
    def __init__(self, reply_text, parsed):
        self.responses = FakeResponses(reply_text, parsed)


@pytest.fixture()
def fake_llm(monkeypatch):
    def install(reply_text, parsed) -> None:
        monkeypatch.setattr(llm, "get_client", lambda: FakeClient(reply_text, parsed))

    return install


def test_selection_turn_returns_none_documentid_until_confirmed(fake_llm):
    fake_llm("What kind of agreement do you need?", DocumentSelection(documentId=None))

    response = run_generic_chat_turn(
        GenericChatRequest(documentId=None, messages=[ChatMessage(role="user", content="I need something")])
    )

    assert response.documentId is None
    assert response.fields == {}


def test_selection_turn_confirms_a_valid_catalog_id(fake_llm):
    fake_llm("Great, let's do a Pilot Agreement.", DocumentSelection(documentId="pilot-agreement"))

    response = run_generic_chat_turn(
        GenericChatRequest(
            documentId=None,
            messages=[ChatMessage(role="user", content="A pilot agreement please")],
        )
    )

    assert response.documentId == "pilot-agreement"


def test_selection_turn_rejects_hallucinated_document_id(fake_llm):
    fake_llm("Sure!", DocumentSelection(documentId="not-a-real-template"))

    response = run_generic_chat_turn(
        GenericChatRequest(documentId=None, messages=[ChatMessage(role="user", content="something")])
    )

    assert response.documentId is None


def test_field_collection_turn_extracts_known_fields(fake_llm):
    meta = get_template_meta("pilot-agreement")
    template_text = read_template_file(meta["files"]["standardTerms"])
    variables = extract_field_variables(template_text)
    model, slug_to_label = build_extraction_model("pilot-agreement", variables)
    customer_slug = next(slug for slug, label in slug_to_label.items() if label == "Customer")
    parsed = model(**{customer_slug: "Acme Inc"})

    fake_llm("Thanks, got it.", parsed)

    response = run_generic_chat_turn(
        GenericChatRequest(
            documentId="pilot-agreement",
            messages=[ChatMessage(role="user", content="Customer is Acme Inc")],
        )
    )

    assert response.documentId == "pilot-agreement"
    assert response.fields["Customer"] == "Acme Inc"


def test_field_collection_turn_falls_back_to_selection_for_unknown_document(fake_llm):
    fake_llm("What do you need?", DocumentSelection(documentId=None))

    response = run_generic_chat_turn(
        GenericChatRequest(documentId="not-a-real-template", messages=[ChatMessage(role="user", content="hi")])
    )

    assert response.documentId is None


def test_chat_generic_endpoint_returns_selection_response(authenticated_client, fake_llm):
    fake_llm("Hi, what do you need?", DocumentSelection(documentId=None))

    response = authenticated_client.post(
        "/api/chat/generic",
        json={"documentId": None, "messages": [{"role": "user", "content": "hello"}]},
    )

    assert response.status_code == 200
    assert response.json()["documentId"] is None


def test_chat_generic_endpoint_requires_authentication(client):
    response = client.post(
        "/api/chat/generic",
        json={"documentId": None, "messages": [{"role": "user", "content": "hi"}]},
    )

    assert response.status_code == 401


def test_document_content_endpoint_returns_template_text(client):
    response = client.get("/api/documents/pilot-agreement/content")

    assert response.status_code == 200
    body = response.json()
    assert "standardTerms" in body
    assert body["coverPage"] is None
    assert "Customer" in body["fields"]


def test_document_content_endpoint_includes_cover_page_for_mnda(client):
    response = client.get("/api/documents/mutual-nda/content")

    assert response.status_code == 200
    assert response.json()["coverPage"] is not None


def test_document_content_endpoint_404s_for_unknown_id(client):
    response = client.get("/api/documents/not-a-real-template/content")

    assert response.status_code == 404
