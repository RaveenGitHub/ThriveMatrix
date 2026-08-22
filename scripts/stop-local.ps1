$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "Stopping ThriveMatrix local services to reduce idle runtime and Docker cost..."

$services = @("api", "web", "mariadb", "redis", "object-storage")
foreach ($service in $services) {
    try {
        docker compose stop $service 2>$null | Out-Null
        Write-Host "Stopped $service"
    } catch {
        Write-Host "Service $service was already stopped or unavailable."
    }
}

Write-Host "Done. Restart with scripts\start-local.ps1 when needed."
