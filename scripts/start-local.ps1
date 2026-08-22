param(
    [switch]$CoreOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logDir = Join-Path $repoRoot "logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Review the values before continuing."
} else {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "postgresql\+psycopg|POSTGRES_PASSWORD|localhost:5432") {
        $normalizedEnv = @"
APP_ENV=local
APP_SECRET=replace-with-a-long-random-secret
DATABASE_URL=mysql+pymysql://thrivematrix:replace-with-a-local-secret@localhost:3306/thrivematrix
REDIS_URL=redis://localhost:6379/0
MARIADB_ROOT_PASSWORD=replace-with-a-local-secret
MARIADB_PASSWORD=replace-with-a-local-secret
MINIO_ROOT_USER=localadmin
MINIO_ROOT_PASSWORD=replace-with-a-local-secret
SESSION_DB_PATH=./api/data/thrivematrix_sessions.db
SECURITY_COOKIE_SECURE=true
SECURITY_COOKIE_SAMESITE=lax
"@
        Set-Content -Path ".env" -Value $normalizedEnv -Encoding UTF8
        Write-Host "Normalized .env to MariaDB local staging defaults. Review the values before continuing."
    }
}

$venvDir = Join-Path $repoRoot "api\.venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Creating Python venv for local staging..."
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3.12 -m venv $venvDir
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        & python -m venv $venvDir
    } else {
        throw "Python 3.12+ is required but was not found in PATH."
    }
}

if (-not (Test-Path $venvPython)) {
    throw "The created Python virtual environment was not found at $venvPython."
}

Write-Host "Installing backend dependencies..."
& $venvPython -m pip install --upgrade pip | Out-Null
& $venvPython -m pip install -e "api[dev]" | Out-Null

if (-not (Test-Path "web\node_modules")) {
    Write-Host "Installing frontend dependencies..."
    & npm install --prefix web | Out-Null
}

$dockerAvailable = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        & docker info 2>$null | Out-Null
        $dockerAvailable = ($LASTEXITCODE -eq 0)
    } catch {
        $dockerAvailable = $false
    }
}

if ($dockerAvailable) {
    if ($CoreOnly) {
        Write-Host "Starting minimal low-cost core services with Docker (MariaDB + Redis only)..."
        & docker compose --profile core up -d --no-recreate mariadb redis | Out-Null
        Write-Host "- MariaDB: localhost:3306"
        Write-Host "- Redis: localhost:6379"
    } else {
        Write-Host "Starting local staging support services with Docker (reusing running containers when possible)..."
        & docker compose --profile core --profile storage --profile full up -d --no-recreate | Out-Null
        Write-Host "- MariaDB: localhost:3306"
        Write-Host "- Redis: localhost:6379"
        Write-Host "- MinIO Console: http://localhost:9001"
        Write-Host "- MinIO API: http://localhost:9000"
    }
} else {
    Write-Host "Docker daemon unavailable; skipping compose infrastructure startup. The app can still run locally for staging testing."
}

foreach ($port in 8000, 3000) {
    $currentConnections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($currentConnections) {
        foreach ($connection in $currentConnections) {
            if ($connection.OwningProcess) {
                try {
                    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
                } catch {
                    # Ignore port conflicts and continue with the startup flow.
                }
            }
        }
    }
}

$backendLog = Join-Path $logDir "backend.log"
$backendErrLog = Join-Path $logDir "backend.err.log"
$frontendLog = Join-Path $logDir "frontend.log"
$frontendErrLog = Join-Path $logDir "frontend.err.log"

$backendProcess = $null
$frontendProcess = $null

$backendAlreadyRunning = $false
try {
    $backendAlreadyRunning = (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/health/live" -TimeoutSec 3 -ErrorAction Stop).StatusCode -eq 200
} catch {
    $backendAlreadyRunning = $false
}

if (-not $backendAlreadyRunning) {
    Write-Host "Starting ThriveMatrix backend..."
    $backendProcess = Start-Process -FilePath $venvPython -ArgumentList @(
        "-m",
        "uvicorn",
        "app.main:app",
        "--app-dir",
        "api",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    ) -WorkingDirectory $repoRoot -PassThru -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrLog
} else {
    Write-Host "Backend already running on http://127.0.0.1:8000; reusing current process."
}

$frontendAlreadyRunning = $false
try {
    $frontendAlreadyRunning = (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3000" -TimeoutSec 3 -ErrorAction Stop).StatusCode -eq 200
} catch {
    $frontendAlreadyRunning = $false
}

if (-not $frontendAlreadyRunning) {
    Write-Host "Starting ThriveMatrix frontend..."
    $frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList @(
        "run",
        "dev",
        "--prefix",
        "web",
        "--",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3000"
    ) -WorkingDirectory $repoRoot -PassThru -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErrLog
} else {
    Write-Host "Frontend already running on http://127.0.0.1:3000; reusing current process."
}

$apiReady = $false
$webReady = $false
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
while ($stopwatch.Elapsed.TotalSeconds -lt 60) {
    try {
        $apiResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/health/live" -TimeoutSec 5
        if ($apiResponse.StatusCode -eq 200) { $apiReady = $true }
    } catch {
        $apiReady = $false
    }

    try {
        $webResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3000" -TimeoutSec 5
        if ($webResponse.StatusCode -eq 200) { $webReady = $true }
    } catch {
        $webReady = $false
    }

    if ($apiReady -and $webReady) {
        break
    }

    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Staging startup complete."
if ($backendProcess) { Write-Host "Backend PID: $($backendProcess.Id)" }
if ($frontendProcess) { Write-Host "Frontend PID: $($frontendProcess.Id)" }
Write-Host "API: http://127.0.0.1:8000/docs"
Write-Host "Web: http://127.0.0.1:3000"
Write-Host "Logs: $backendLog, $backendErrLog | $frontendLog, $frontendErrLog"
Write-Host "Tip: run scripts\stop-local.ps1 when you want to cleanly stop Docker-backed services and avoid idle runtime cost."

if (-not $apiReady -or -not $webReady) {
    Write-Warning "One or more services did not become ready within the startup window. Check the log files above."
}
