---
name: openai-llm
description: Call an OpenAI GPT model (gpt-4.1) using the official OpenAI Python SDK, with structured outputs via Pydantic. Use this whenever writing code that calls an LLM.
---

# Calling an LLM via the OpenAI SDK

These instructions let you write code to call an OpenAI GPT model with the official
`openai` Python SDK, using **structured outputs** so results map cleanly onto document fields.

## Setup
- Dependency: `uv add openai pydantic`
- Env var: `OPENAI_API_KEY` (never hardcode it).
- Model: `gpt-4.1` (swap to `gpt-4.1-mini` for cheaper/faster calls).

## Imports & constants
```python
import os
from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()          # reads OPENAI_API_KEY from the environment
MODEL = "gpt-4.1"
```

## Code to call the LLM (free-form text)
```python
def call_llm(messages: list[dict]) -> str:
    resp = client.responses.create(model=MODEL, input=messages)
    return resp.output_text
```

## Code to call the LLM for structured outputs
Define the document's fields as a Pydantic model and pass it as `text_format`; the SDK
enforces the schema and hands back a parsed object you can use directly. Model the fields
on the target document in `templates/templates.json` (example below is for the Mutual NDA).

```python
from typing import Literal

class MndaFields(BaseModel):
    party1_name: str
    party1_company: str
    party2_name: str
    party2_company: str
    purpose: str
    effective_date: str  # ISO 8601
    mnda_term_type: Literal["expires", "continues"]
    governing_law: str
    jurisdiction: str

def extract_fields(messages: list[dict]) -> MndaFields:
    resp = client.responses.parse(
        model=MODEL,
        input=messages,
        text_format=MndaFields,
    )
    return resp.output_parsed   # a validated MndaFields instance
```

Use the returned object to fill the document template's placeholders.
