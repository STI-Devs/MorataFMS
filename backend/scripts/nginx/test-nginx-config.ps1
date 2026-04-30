param(
    [string]$NginxRoot = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\nginxinc.nginx_Microsoft.Winget.Source_8wekyb3d8bbwe\nginx-1.29.8",
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$templatePath = Join-Path $backendRoot 'docker\nginx\default.conf'
$tempDir = Join-Path $scriptDir '.nginx-test'
$renderedServerPath = Join-Path $tempDir 'default.rendered.conf'
$mainConfigPath = Join-Path $tempDir 'nginx.test.conf'
$nginxExePath = Join-Path $NginxRoot 'nginx.exe'

if (-not (Test-Path $templatePath)) {
    throw "Template config not found: $templatePath"
}

if (-not (Test-Path $nginxExePath)) {
    throw "nginx.exe not found at: $nginxExePath"
}

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$nginxRootForConfig = $NginxRoot.Replace('\', '/')
$renderedServerPathForConfig = $renderedServerPath.Replace('\', '/')

$renderedServerConfig = (Get-Content $templatePath -Raw).Replace('${PORT}', $Port)
$renderedServerConfig = $renderedServerConfig.Replace(
    'include fastcgi_params;',
    "include $nginxRootForConfig/conf/fastcgi_params;"
)

Set-Content -Path $renderedServerPath -Value $renderedServerConfig -NoNewline

$mainConfig = @"
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       $nginxRootForConfig/conf/mime.types;
    default_type  application/octet-stream;

    include       $renderedServerPathForConfig;
}
"@

Set-Content -Path $mainConfigPath -Value $mainConfig -NoNewline

& $nginxExePath -p $NginxRoot -c $mainConfigPath -t
