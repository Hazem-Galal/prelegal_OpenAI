$ErrorActionPreference = "Stop"
# Build and run Pre-Legal. Frontend at http://localhost:3000, backend at http://localhost:8000
Set-Location (Join-Path $PSScriptRoot "..")
docker compose up -d --build
Write-Host "Pre-Legal running at http://localhost:3000 (backend: http://localhost:8000)"
