param()

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$bashScript = Join-Path $scriptDirectory "run-frontend-ci-checks.sh"
$bashScriptForBash = $bashScript -replace "\\", "/"

$gitBashPath = "C:\Program Files\Git\bin\bash.exe"
if (Test-Path -LiteralPath $gitBashPath) {
    & $gitBashPath $bashScriptForBash
    exit $LASTEXITCODE
}

$bashCommand = Get-Command bash -ErrorAction SilentlyContinue
if (-not $bashCommand) {
    Write-Error "Unable to find bash. Install Git for Windows or ensure bash is on PATH."
    exit 1
}

& $bashCommand.Source $bashScriptForBash
exit $LASTEXITCODE
