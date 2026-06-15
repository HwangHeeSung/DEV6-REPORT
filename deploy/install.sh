#!/usr/bin/env bash
# 개발 서버 최초 1회 (JAR)
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"
JAR="${JAR_FILE:-$APP_DIR/target/dev6-report-1.0.0.jar}"

echo "[1/4] Java 확인"
command -v java >/dev/null || { echo "Java 17+ 필요"; exit 1; }
java -version

echo "[2/4] 디렉터리"
mkdir -p logs

if [ ! -f .env ]; then
  echo ".env 없음 → .env.example 복사 후 DB 정보 입력"
  cp -n .env.example .env 2>/dev/null || true
  exit 1
fi

if [ ! -f "$JAR" ]; then
  echo "JAR 없음: $JAR"
  echo "로컬에서 scripts/build.ps1 실행 후 배포"
  exit 1
fi

echo "[3/4] JAR → APP_HOME 복사"
cp -f "$JAR" "$APP_DIR/dev6-report-1.0.0.jar"

echo "[4/4] systemd 등록 (선택)"
UNIT=/etc/systemd/system/dev6-report.service
if [ -w /etc/systemd/system ] 2>/dev/null && [ -f deploy/dev6-report.service ]; then
  sed "s|@APP_DIR@|$APP_DIR|g; s|@JAR@|$APP_DIR/dev6-report-1.0.0.jar|g" deploy/dev6-report.service | sudo tee "$UNIT" >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable dev6-report
  sudo systemctl restart dev6-report
  echo "systemd 시작 완료: sudo systemctl status dev6-report"
else
  echo "스크립트로 기동:"
  echo "  mkdir -p /bt/dev6Report/scripts"
  echo "  cp scripts/dev6-report.sh /bt/dev6Report/scripts/"
  echo "  chmod +x /bt/dev6Report/scripts/dev6-report.sh"
  echo "  /bt/dev6Report/scripts/dev6-report.sh start"
fi
