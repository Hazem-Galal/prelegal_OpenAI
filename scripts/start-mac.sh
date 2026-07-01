#!/usr/bin/env bash
set -euo pipefail
# Build and run Pre-Legal. Backend serves at http://localhost:8000
cd "$(dirname "$0")/.."
docker build -t prelegal .
docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
echo "Pre-Legal running at http://localhost:8000"
