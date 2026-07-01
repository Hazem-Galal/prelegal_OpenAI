# Pre-Legal

Pre-Legal is a SaaS product that lets users draft legal agreements from templates.
Users hold a chat to establish which document they want and how to fill in its fields.
The document templates live in the `templates/` directory, each in its own subfolder
(sourced from Common Paper). The available documents are indexed in `templates/templates.json`:

@templates/templates.json

The initial prototype was frontend-only, form-based, and limited to the Mutual NDA. The
backend and a real chat-to-document flow are being built up ticket by ticket (see
Implementation status below).

> Full business requirements are NOT in this file. They live in Jira (see Development
> process). This file gives the overall context so the work stays coherent.

## Development process
- Use your **Atlassian tools** to read the feature instructions from **Jira**.
- Develop the feature. **Do not skip any steps** — factor in what we've already learned.
- Thoroughly test the feature with **unit tests** and **integration tests**.
- Fix any issues you find.
- Submit a **PR using your GitHub tools**.

## AI design
- When writing code that makes calls to LLMs, **use your `openai-llm` skill**.
- It calls an **OpenAI GPT model** using the **official OpenAI Python SDK**.
- Model: `gpt-4.1` (use `gpt-4.1-mini` for cheaper/faster field extraction).
- Always use **structured outputs** (Pydantic + the Responses API `parse`) so you can
  interpret the results and populate the fields in the legal document reliably.

## Technical design
- The project runs as **two Docker containers** via `docker-compose.yml`: `backend` and
  `frontend`. `scripts/start-*`/`stop-*` wrap `docker compose up --build` / `down`.
- The **backend** lives in `backend/` — a **`uv`** project using **FastAPI**.
- The **frontend** lives in `frontend/`.
- There should be scripts in `scripts/` for each platform:

    # Mac
    scripts/start-mac.sh        # Start
    scripts/stop-mac.sh         # Stop

    # Linux
    scripts/start-linux.sh
    scripts/stop-linux.sh

    # Windows
    scripts/start-windows.ps1
    scripts/stop-windows.ps1

- Backend available at http://localhost:8000
- The database uses **SQLite** and is recreated from scratch every time the backend
  starts. It has a **users** table backing real `POST /api/auth/signup` /
  `/api/auth/signin` endpoints (bcrypt-hashed passwords). The frontend login screen at
  `/` calls these endpoints but doesn't gate on the result yet — it always continues
  into `/app` (no real auth enforcement yet).

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation status
- **PR-4 (done)**: V1 technical foundation — FastAPI backend, SQLite `users` table with
  real signup/signin, docker-compose (backend + frontend), platform start/stop scripts,
  fake login screen at `/` (redirects into `/app` regardless of auth result). The
  existing form-based Mutual NDA creator moved from `/` to `/app` unchanged.
- **PR-5 (done)**: added a freeform AI chat (`POST /api/chat`, stateless — the frontend
  resends the full message history each turn, no backend persistence) as an additional
  way to fill out the Mutual NDA creator, alongside (not replacing) the existing
  field-by-field form — both write into the same shared state. Two LLM calls per turn:
  a conversational reply (`OPENAI_CHAT_MODEL`, default `gpt-4.1`) and a structured-output
  extraction pass (`OPENAI_EXTRACTION_MODEL`, default `gpt-4.1-mini`) that re-derives the
  known MNDA fields from the whole conversation. Still scoped to the Mutual NDA only.
- **PR-6 (done)**: expanded document creation to all templates in `templates/templates.json`.
  `/app` still defaults straight into the Mutual NDA's chat+form+preview (unchanged from
  PR-5); a "Need a different document instead?" link reveals an inline document-selection
  chat (`POST /api/chat/generic`) without ever hiding the current document's form/preview.
  The LLM matches free text against the catalog and offers the closest available document
  if unsupported. Once confirmed, `mutual-nda` hands off to the existing, untouched MNDA
  pipeline (chat + form); every other document goes through a new generic pipeline —
  chat **and** a field-by-field form, mirroring MNDA — that auto-derives its field list at
  runtime from the template's own `<span class="X_link">Variable</span>` markup (no
  per-document schema authored by hand — scales to new templates automatically). Shared
  OpenAI-calling logic (`reply`/`extract`) lives in `backend/app/llm.py`, used by both the
  MNDA and generic pipelines.
