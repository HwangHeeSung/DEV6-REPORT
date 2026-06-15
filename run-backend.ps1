# 개발6팀 보고 API 백엔드 실행 (Maven 설치 불필요 — mvnw 사용)
$ErrorActionPreference = "Stop"

$jdk17 = "C:\Program Files\Java\jdk-17"
if (Test-Path $jdk17) {
    $env:JAVA_HOME = $jdk17
    $env:Path = "$jdk17\bin;" + $env:Path
} else {
    Write-Warning "JDK 17을 찾지 못했습니다. JAVA_HOME을 JDK 17로 설정해 주세요. (Spring Boot 3는 Java 17+ 필요)"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# MySQL — argo_db_mysql8 (BT Dashboard와 동일: 100.100.107.115:3318)
# 셸에 MYSQL_HOST=localhost 등이 남아 있으면 잘못된 DB로 접속하므로 항상 덮어씁니다.
# 로컬 Docker 사용 시 아래 4줄만 수정하세요.
$env:MYSQL_HOST = "100.100.107.115"
$env:MYSQL_PORT = "3318"
$env:MYSQL_DATABASE = "reportDb"
$env:MYSQL_USERNAME = "BTREPORT"
$env:MYSQL_PASSWORD = "BTREPORT"

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "MySQL=$env:MYSQL_HOST`:$env:MYSQL_PORT/$env:MYSQL_DATABASE"
Write-Host "API http://localhost:8993"
Write-Host ""

Push-Location "$root\backend"
try {
    & ".\mvnw.cmd" spring-boot:run
} finally {
    Pop-Location
}
