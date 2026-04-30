param()

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDirectory "..\..")
$lefthook = Get-Command lefthook -ErrorAction SilentlyContinue

if (-not $lefthook) {
    Write-Error "Lefthook is not installed. Install it first, then rerun this script. Official docs: https://lefthook.dev/install"
    exit 1
}

$existingHooksPath = git -C $repoRoot config --local --get core.hooksPath 2>$null
if ($LASTEXITCODE -eq 0 -and $existingHooksPath) {
    git -C $repoRoot config --local --unset core.hooksPath
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Push-Location $repoRoot
try {
    & $lefthook.Source install pre-push
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    & $lefthook.Source validate
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

Write-Host "Installed Lefthook pre-push hook for this repository."
Write-Host "git push will now run the local workspace CI checks before GitHub sees the branch."
