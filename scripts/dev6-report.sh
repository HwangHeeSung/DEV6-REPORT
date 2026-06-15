#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# 스크립트 위치: /bt/dev6Report/scripts/dev6-report.sh → APP_HOME=/bt/dev6Report
APP_HOME="${APP_HOME:-$(cd "$SCRIPT_DIR/.." && pwd)}"

# ===== 기본 설정 (서버 배포 경로) =====
JAVA_BIN="${JAVA_BIN:-/opt/jdk-17/bin/java}"
JAR_PATH="${JAR_PATH:-$APP_HOME/dev6-report-1.0.0.jar}"
PID_FILE="${PID_FILE:-$APP_HOME/dev6-report.pid}"
LOG_FILE="${LOG_FILE:-$APP_HOME/dev6-report.log}"

usage() {
  cat <<EOF
사용법:
  $0 start     # 백그라운드 실행
  $0 stop      # 프로세스 종료
  $0 restart   # 재시작
  $0 status    # 상태 확인
  $0 logs      # 로그 tail

환경변수(선택):
  JAVA_BIN=/opt/jdk-17/bin/java
  APP_HOME=/bt/dev6Report
  JAR_PATH=/bt/dev6Report/dev6-report-1.0.0.jar
  PID_FILE=/bt/dev6Report/dev6-report.pid
  LOG_FILE=/bt/dev6Report/dev6-report.log
EOF
}

is_running() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

start_app() {
  if is_running; then
    echo "이미 실행 중입니다. PID=$(cat "$PID_FILE")"
    exit 0
  fi

  if [[ ! -x "$JAVA_BIN" ]]; then
    echo "오류: JAVA_BIN 실행 파일이 없습니다: $JAVA_BIN"
    exit 1
  fi

  if [[ ! -f "$JAR_PATH" ]]; then
    echo "오류: JAR 파일이 없습니다: $JAR_PATH"
    exit 1
  fi

  if [[ ! -f "$APP_HOME/.env" ]]; then
    echo "오류: .env 파일이 없습니다: $APP_HOME/.env"
    exit 1
  fi

  mkdir -p "$APP_HOME"

  echo "시작 중..."
  cd "$APP_HOME"
  nohup "$JAVA_BIN" -jar "$JAR_PATH" >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  sleep 1

  if is_running; then
    echo "시작 완료. PID=$(cat "$PID_FILE")"
    echo "APP_HOME=$APP_HOME"
    echo "로그: $LOG_FILE"
  else
    echo "시작 실패. 로그 확인: $LOG_FILE"
    exit 1
  fi
}

stop_app() {
  if ! is_running; then
    echo "실행 중이 아닙니다."
    rm -f "$PID_FILE"
    exit 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  echo "종료 중... PID=$pid"
  kill "$pid" 2>/dev/null || true

  for _ in {1..10}; do
    if kill -0 "$pid" 2>/dev/null; then
      sleep 1
    else
      break
    fi
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "강제 종료(SIGKILL)..."
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "종료 완료"
}

status_app() {
  if is_running; then
    echo "RUNNING: PID=$(cat "$PID_FILE")"
    echo "APP_HOME=$APP_HOME"
    echo "JAR=$JAR_PATH"
  else
    echo "STOPPED"
    exit 1
  fi
}

logs_app() {
  mkdir -p "$APP_HOME"
  touch "$LOG_FILE"
  tail -f "$LOG_FILE"
}

cmd="${1:-}"
case "$cmd" in
  start) start_app ;;
  stop) stop_app ;;
  restart) stop_app; start_app ;;
  status) status_app ;;
  logs) logs_app ;;
  *) usage; exit 1 ;;
esac
