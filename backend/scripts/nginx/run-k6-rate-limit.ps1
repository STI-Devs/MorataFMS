param(
    [string]$BaseUrl = 'http://127.0.0.1:8000',
    [string]$K6Path = 'C:\Program Files\k6\k6.exe',
    [string]$LoginEmail,
    [string]$LoginPassword,
    [string]$InvalidLoginEmail = 'rate-limit-test@example.invalid',
    [string]$InvalidLoginPassword = 'definitely-wrong-password',
    [string]$TurnstileToken = '',
    [switch]$EnableNginxCsrfBurst,
    [switch]$EnableNginxLoginBurst,
    [switch]$EnableInvalidLoginThrottle,
    [switch]$EnableApiGeneralBurst,
    [switch]$EnableApiSearchBurst,
    [switch]$EnableApiAdminBurst,
    [switch]$EnableAppRateLimitSuite,
    [int]$CsrfBurstRequests = 20,
    [int]$NginxLoginBurstRequests = 20,
    [int]$InvalidLoginRequests = 6,
    [int]$ApiGeneralRequests = 95,
    [int]$ApiSearchRequests = 50,
    [int]$ApiAdminRequests = 130
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $scriptDir 'k6-rate-limit.js'

if (-not (Test-Path $K6Path)) {
    throw "k6.exe not found at: $K6Path"
}

$shouldRunNginxCsrfBurst = $EnableNginxCsrfBurst -or (
    -not $EnableNginxLoginBurst -and
    -not $EnableInvalidLoginThrottle -and
    -not $EnableApiGeneralBurst -and
    -not $EnableApiSearchBurst -and
    -not $EnableApiAdminBurst -and
    -not $EnableAppRateLimitSuite
)

$shouldRunNginxLoginBurst = $EnableNginxLoginBurst
$shouldRunInvalidLoginThrottle = $EnableInvalidLoginThrottle -or $EnableAppRateLimitSuite
$shouldRunApiGeneralBurst = $EnableApiGeneralBurst -or $EnableAppRateLimitSuite
$shouldRunApiSearchBurst = $EnableApiSearchBurst -or $EnableAppRateLimitSuite
$shouldRunApiAdminBurst = $EnableApiAdminBurst -or $EnableAppRateLimitSuite

$requiresCredentials = $shouldRunNginxLoginBurst -or $shouldRunInvalidLoginThrottle -or $shouldRunApiGeneralBurst -or $shouldRunApiSearchBurst -or $shouldRunApiAdminBurst

if ($requiresCredentials -and ([string]::IsNullOrWhiteSpace($LoginEmail) -or [string]::IsNullOrWhiteSpace($LoginPassword))) {
    throw "LoginEmail and LoginPassword are required for the selected auth scenarios."
}

$arguments = @(
    'run',
    '--env', "BASE_URL=$BaseUrl",
    '--env', "CSRF_BURST_REQUESTS=$CsrfBurstRequests",
    '--env', "NGINX_LOGIN_BURST_REQUESTS=$NginxLoginBurstRequests",
    '--env', "INVALID_LOGIN_REQUESTS=$InvalidLoginRequests",
    '--env', "API_GENERAL_REQUESTS=$ApiGeneralRequests",
    '--env', "API_SEARCH_REQUESTS=$ApiSearchRequests",
    '--env', "API_ADMIN_REQUESTS=$ApiAdminRequests",
    '--env', ("ENABLE_NGINX_CSRF_BURST=" + ($(if ($shouldRunNginxCsrfBurst) { '1' } else { '0' }))),
    '--env', ("ENABLE_NGINX_LOGIN_BURST=" + ($(if ($shouldRunNginxLoginBurst) { '1' } else { '0' }))),
    '--env', ("ENABLE_INVALID_LOGIN_THROTTLE=" + ($(if ($shouldRunInvalidLoginThrottle) { '1' } else { '0' }))),
    '--env', ("ENABLE_API_GENERAL_BURST=" + ($(if ($shouldRunApiGeneralBurst) { '1' } else { '0' }))),
    '--env', ("ENABLE_API_SEARCH_BURST=" + ($(if ($shouldRunApiSearchBurst) { '1' } else { '0' }))),
    '--env', ("ENABLE_API_ADMIN_BURST=" + ($(if ($shouldRunApiAdminBurst) { '1' } else { '0' })))
)

if (-not [string]::IsNullOrWhiteSpace($LoginEmail)) {
    $arguments += @('--env', "LOGIN_EMAIL=$LoginEmail")
}

if (-not [string]::IsNullOrWhiteSpace($LoginPassword)) {
    $arguments += @('--env', "LOGIN_PASSWORD=$LoginPassword")
}

if (-not [string]::IsNullOrWhiteSpace($InvalidLoginEmail)) {
    $arguments += @('--env', "INVALID_LOGIN_EMAIL=$InvalidLoginEmail")
}

if (-not [string]::IsNullOrWhiteSpace($InvalidLoginPassword)) {
    $arguments += @('--env', "INVALID_LOGIN_PASSWORD=$InvalidLoginPassword")
}

if (-not [string]::IsNullOrWhiteSpace($TurnstileToken)) {
    $arguments += @('--env', "TURNSTILE_TOKEN=$TurnstileToken")
}

$arguments += $scriptPath

& $K6Path @arguments
