# DEV6_PORTAL 과 동일한 빌드 순서: npm build → mvn package -Pbundle-frontend
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "npm install" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "npm run build" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "backend\mvnw.cmd clean package -Pbundle-frontend" -ForegroundColor Cyan
Set-Location (Join-Path $Root 'backend')
& .\mvnw.cmd clean package -Pbundle-frontend -DskipTests
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$jar = Get-ChildItem 'target\dev6-report-*.jar' | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1
Write-Host ""
Write-Host "빌드 완료: $($jar.FullName)" -ForegroundColor Green
Write-Host "로컬 실행: cd .. ; .\scripts\run-jar.ps1" -ForegroundColor Green
