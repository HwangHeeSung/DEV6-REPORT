# 프로젝트 루트에서 실행 (.env 위치)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$jdk17 = 'C:\Program Files\Java\jdk-17'
if (Test-Path $jdk17) {
    $env:JAVA_HOME = $jdk17
    $env:Path = "$jdk17\bin;" + $env:Path
}

$jar = Get-ChildItem (Join-Path $Root 'backend\target\dev6-report-*.jar') -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1

if (-not $jar) {
    Write-Host "JAR 없음. 먼저:" -ForegroundColor Red
    Write-Host "  .\scripts\build.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "실행: $($jar.FullName)" -ForegroundColor Cyan
java -jar $jar.FullName
