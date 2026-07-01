$ErrorActionPreference = "Stop"
# Build and run Pre-Legal. Backend serves at http://localhost:8000
Set-Location (Join-Path $PSScriptRoot "..")
docker build -t prelegal .
docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
Write-Host "Pre-Legal running at http://localhost:8000"
