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
  `/api/auth/signin` endpoints (bcrypt-hashed passwords), a **sessions** table backing
  cookie-based login (HttpOnly `session_id` cookie), and a **documents** table storing
  each user's generated documents (auto-saved, keyed by a client-generated UUID). All
  three tables reset on every backend restart, including active sessions — the
  frontend's `/app/**` layout re-validates against `GET /api/auth/me` on every request
  rather than trusting cookie presence alone, so a stale post-restart cookie correctly
  bounces back to sign-in instead of leaving a broken half-authenticated state.

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
- **PR-7 (done)**: real multi-user support and final polish. Sign-in/sign-up now actually
  gates access — a successful `signup`/`signin` sets an HttpOnly `session_id` cookie
  (backed by a new `sessions` table); `frontend/app/app/layout.tsx` is a server-side auth
  gate for everything under `/app/**`, redirecting to `/` if the session is missing or
  invalid. `/api/chat` and `/api/chat/generic` now require authentication too. Every
  document a user creates is auto-saved (debounced, ~800ms) into a new `documents` table
  keyed by a client-generated UUID; `/app/documents` lists a user's past documents, and
  clicking one resumes it fully (`/app?resume={id}`) with the same UUID continuing to
  upsert into the same row. Polish: the login screen's brand palette is now the one
  color system app-wide (`--color-primary` repointed to the brand blue — no per-component
  class changes needed), a shared `AppHeader` (brand, "My Documents", sign-out) appears
  on every authenticated page, the "Prototype" badge is gone, loading/thinking states use
  a small spinner, and both preview components have dark-mode styling. Every generated
  document (and its exported PDF) now shows a "draft, not reviewed by an attorney"
  disclaimer.
