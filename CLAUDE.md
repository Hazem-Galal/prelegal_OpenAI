# Pre-Legal

Pre-Legal is a SaaS product that lets users draft legal agreements from templates.
Users hold a chat to establish which document they want and how to fill in its fields.
The document templates live in the `templates/` directory, each in its own subfolder
(sourced from Common Paper). The available documents are indexed in `templates/templates.json`:

@templates/templates.json

The initial implementation is a **frontend-only prototype** — enough to demonstrate the
chat-to-document flow before we build the backend.

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
- The entire project is packaged into a **Docker container**.
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

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`
