# Flyway checksum 불일치 repair (V4 파일 변경 후 1회 실행)
$ErrorActionPreference = "Stop"

$jdk17 = "C:\Program Files\Java\jdk-17"
if (Test-Path $jdk17) {
    $env:JAVA_HOME = $jdk17
    $env:Path = "$jdk17\bin;" + $env:Path
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $projectRoot "backend"

Push-Location $backend
try {
    Write-Host "Flyway repair (reportDb @ 100.100.107.115:3318)..."
    & ".\mvnw.cmd" org.flywaydb:flyway-maven-plugin:9.22.3:repair `
        "-Dflyway.configFiles=flyway-repair.properties"
    Write-Host "완료. .\run-backend.ps1 로 백엔드를 다시 실행하세요."
} finally {
    Pop-Location
}
