$ErrorActionPreference = "Stop"
docker stop prelegal
docker rm prelegal
Write-Host "Pre-Legal stopped."
