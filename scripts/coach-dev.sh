#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${COACH_DEV_PORT:-3100}"
STATE_DIR="$ROOT_DIR/.coach-dev"
PID_FILE="$STATE_DIR/coach-dev.pid"
LOG_FILE="$STATE_DIR/coach-dev.log"

is_running() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

health_check() {
  curl -fsS "http://localhost:$PORT" >/dev/null 2>&1
}

port_pid() {
  ss -ltnp "sport = :$PORT" 2>/dev/null |
    sed -n 's/.*pid=\([0-9]\+\).*/\1/p' |
    head -n 1
}

start_server() {
  mkdir -p "$STATE_DIR"

  if is_running; then
    if health_check; then
      echo "Coach dev server is already running on http://localhost:$PORT"
      return
    fi

    echo "Removing stale Coach dev server PID $(cat "$PID_FILE")"
    rm -f "$PID_FILE"
  fi

  if ss -ltn "sport = :$PORT" | grep -q ":$PORT"; then
    if health_check; then
      existing_pid="$(port_pid)"
      if [[ -n "$existing_pid" ]]; then
        echo "$existing_pid" >"$PID_FILE"
      fi
      echo "Coach dev server is already running on http://localhost:$PORT"
      return
    fi

    echo "Port $PORT is already in use but did not pass the health-check."
    echo "Stop the other process or set COACH_DEV_PORT."
    ss -ltnp "sport = :$PORT" || true
    exit 1
  fi

  (
    cd "$ROOT_DIR"
    export PORT
    setsid bash -lc 'source "$HOME/.nvm/nvm.sh" && nvm use >/dev/null && exec npm run dev -- -H 0.0.0.0 -p "$PORT"' \
      >"$LOG_FILE" 2>&1 </dev/null &
    echo $! >"$PID_FILE"
  )

  for _ in {1..30}; do
    if health_check; then
      echo "Coach dev server ready on http://localhost:$PORT"
      return
    fi
    sleep 1
  done

  echo "Coach dev server did not become healthy. Recent log:"
  tail -n 80 "$LOG_FILE" || true
  exit 1
}

stop_server() {
  if is_running; then
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
    echo "Coach dev server stopped."
    return
  fi

  existing_pid="$(port_pid)"
  if [[ -n "$existing_pid" ]]; then
    kill "$existing_pid"
    rm -f "$PID_FILE"
    echo "Coach dev server stopped."
    return
  fi

  rm -f "$PID_FILE"
  echo "Coach dev server is not running."
}

status_server() {
  if health_check; then
    existing_pid="$(port_pid)"
    if [[ -n "$existing_pid" ]]; then
      mkdir -p "$STATE_DIR"
      echo "$existing_pid" >"$PID_FILE"
    fi
    echo "Coach dev server running on http://localhost:$PORT"
    return
  fi

  if is_running && health_check; then
    echo "Coach dev server running on http://localhost:$PORT"
    return
  fi

  if is_running; then
    echo "Coach dev server process exists but health-check failed."
    tail -n 40 "$LOG_FILE" || true
    exit 1
  fi

  echo "Coach dev server is not running."
  exit 1
}

case "${1:-start}" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  status)
    status_server
    ;;
  restart)
    stop_server
    start_server
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
