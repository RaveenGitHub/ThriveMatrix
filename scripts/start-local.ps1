$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is required but was not found in PATH. Install Docker Desktop or Docker Engine before running local services."
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Review the values before continuing."
}

Write-Host "Starting local ThriveMatrix services..."
docker compose up -d postgres redis object-storage

Write-Host ""
Write-Host "Local runtime is available:"
Write-Host "- Postgres: localhost:5432"
Write-Host "- Redis: localhost:6379"
Write-Host "- MinIO Console: http://localhost:9001"
Write-Host "- MinIO API: http://localhost:9000"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Backend: api/.venv/Scripts/python -m uvicorn app.main:app --app-dir api --reload"
Write-Host "2. Web: npm install --prefix web; npm run dev --prefix web"
