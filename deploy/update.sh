#!/usr/bin/env bash
# 개발 서버 JAR 갱신
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"
JAR="${JAR_FILE:-$APP_DIR/target/dev6-report-1.0.0.jar}"

if [ ! -f .env ]; then
  echo ".env 파일이 없습니다."
  exit 1
fi

if [ ! -f "$JAR" ]; then
  echo "JAR 없음: $JAR"
  exit 1
fi

mkdir -p logs
cp -f "$JAR" "$APP_DIR/dev6-report-1.0.0.jar"

SCRIPT="${DEV6_REPORT_SCRIPT:-/bt/dev6Report/scripts/dev6-report.sh}"

if systemctl is-active dev6-report >/dev/null 2>&1; then
  sudo systemctl restart dev6-report
  sudo systemctl status dev6-report --no-pager
elif [[ -x "$SCRIPT" ]]; then
  "$SCRIPT" restart
else
  pkill -f "dev6-report-1.0.0.jar" 2>/dev/null || true
  nohup java -jar "$APP_DIR/dev6-report-1.0.0.jar" >> logs/app.log 2>&1 &
  echo "JAR 재시작 완료 (PORT는 .env 참고)"
fi
