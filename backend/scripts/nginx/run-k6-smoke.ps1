param(
    [string]$BaseUrl = 'http://127.0.0.1:8000',
    [string]$K6Path = 'C:\Program Files\k6\k6.exe'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $scriptDir 'k6-smoke.js'

if (-not (Test-Path $K6Path)) {
    throw "k6.exe not found at: $K6Path"
}

& $K6Path run --env "BASE_URL=$BaseUrl" $scriptPath
