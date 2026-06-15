# Windows → 개발 서버 JAR 배포
param(
    [switch]$Init,
    [switch]$Build
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$DeployEnvPath = Join-Path $Root '.deploy.env'

function Load-DeployEnv {
    if (-not (Test-Path $DeployEnvPath)) {
        Write-Host ".deploy.env 가 없습니다. .deploy.env.example 을 복사해 설정하세요." -ForegroundColor Red
        exit 1
    }
    Get-Content $DeployEnvPath | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
        $n, $v = $_ -split '=', 2
        Set-Variable -Name $n.Trim() -Value $v.Trim() -Scope Script
    }
}

if ($Build -or -not (Test-Path (Join-Path $Root 'backend\target\dev6-report-1.0.0.jar'))) {
    & (Join-Path $Root 'scripts\build.ps1')
}

Load-DeployEnv
if (-not $DEPLOY_PORT) { $DEPLOY_PORT = 22 }

$Jar = Get-ChildItem (Join-Path $Root 'backend\target\dev6-report-*.jar') | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1
$Staging = Join-Path $env:TEMP 'dev6-report-deploy'
$Archive = Join-Path $env:TEMP 'dev6-report-deploy.zip'

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path "$Staging\target" -Force | Out-Null
New-Item -ItemType Directory -Path "$Staging\deploy" -Force | Out-Null
New-Item -ItemType Directory -Path "$Staging\scripts" -Force | Out-Null

Copy-Item $Jar.FullName "$Staging\target\" -Force
Copy-Item (Join-Path $Root 'deploy\*') "$Staging\deploy\" -Recurse -Force
Copy-Item (Join-Path $Root 'scripts\dev6-report.sh') "$Staging\scripts\" -Force
Copy-Item (Join-Path $Root '.env.example') "$Staging\" -Force -ErrorAction SilentlyContinue

if (Test-Path $Archive) { Remove-Item $Archive -Force }
Compress-Archive -Path (Join-Path $Staging '*') -DestinationPath $Archive -Force

$Target = "${DEPLOY_USER}@${DEPLOY_HOST}"
Write-Host "업로드: $Target`:$DEPLOY_PATH" -ForegroundColor Cyan

ssh -p $DEPLOY_PORT $Target "mkdir -p '$DEPLOY_PATH/target' '$DEPLOY_PATH/deploy' '$DEPLOY_PATH/scripts'"
scp -P $DEPLOY_PORT $Archive "${Target}:${DEPLOY_PATH}/deploy.zip"
ssh -p $DEPLOY_PORT $Target "cd '$DEPLOY_PATH' && unzip -o deploy.zip && rm -f deploy.zip && chmod +x deploy/*.sh scripts/*.sh"

if ($Init) {
    ssh -p $DEPLOY_PORT $Target "cd '$DEPLOY_PATH' && bash deploy/install.sh"
} else {
    ssh -p $DEPLOY_PORT $Target "cd '$DEPLOY_PATH' && bash deploy/update.sh"
}

Remove-Item $Staging -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $Archive -Force -ErrorAction SilentlyContinue
Write-Host "배포 완료" -ForegroundColor Green
