#!/usr/bin/env bash
set -euo pipefail
# Build and run Pre-Legal. Frontend at http://localhost:3000, backend at http://localhost:8000
cd "$(dirname "$0")/.."
docker compose up -d --build
echo "Pre-Legal running at http://localhost:3000 (backend: http://localhost:8000)"
