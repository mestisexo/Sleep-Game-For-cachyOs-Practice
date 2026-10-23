#!/usr/bin/env bash
#
# Verifica que el servidor Nuxt arranca y responde.
#
# Uso:
#   ./scripts/verify-server.sh dev    # servidor de desarrollo
#   ./scripts/verify-server.sh prod   # build de producción + servidor construido
#
# Variables opcionales:
#   PORT                   puerto a usar (por defecto, uno libre)
#   VERIFY_TIMEOUT_SECONDS segundos máximos de espera (por defecto 120)

set -euo pipefail

MODE="${1:-}"
case "$MODE" in
  dev | prod) ;;
  *)
    echo "Uso: $0 [dev|prod]" >&2
    exit 2
    ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TIMEOUT_SECONDS="${VERIFY_TIMEOUT_SECONDS:-120}"
HOST="localhost"
PROJECT_NAME="$(node -p "require('./package.json').name")"
LOG_FILE="$(mktemp -t "nuxt-verify-${MODE}.XXXXXX.log")"
BODY_FILE="$(mktemp -t "nuxt-verify-body.XXXXXX")"
SERVER_PID=""
USE_SETSID=0

if command -v setsid >/dev/null 2>&1; then
  USE_SETSID=1
fi

cleanup() {
  local status=$?
  trap - EXIT INT TERM

  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    if [ "$USE_SETSID" -eq 1 ]; then
      kill -- "-$SERVER_PID" 2>/dev/null || true
    else
      kill "$SERVER_PID" 2>/dev/null || true
    fi
    wait "$SERVER_PID" 2>/dev/null || true
  fi

  rm -f "$BODY_FILE"

  if [ "$status" -ne 0 ]; then
    echo "--- Últimas líneas del log del servidor ---" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    echo "Log completo: $LOG_FILE" >&2
  else
    rm -f "$LOG_FILE"
  fi

  exit "$status"
}

trap cleanup EXIT INT TERM

if [ -z "${PORT:-}" ]; then
  PORT="$(node -e '
const net = require("node:net")
const server = net.createServer()
server.on("error", (error) => {
  console.error(error.message)
  process.exit(1)
})
server.listen(0, "127.0.0.1", () => {
  console.log(server.address().port)
  server.close()
})
')"
fi

BASE_URL="http://${HOST}:${PORT}"

start_server() {
  if [ "$MODE" = "prod" ]; then
    echo "→ Construyendo el servidor de producción..."
    npm run build >"$LOG_FILE" 2>&1
    echo "→ Arrancando el servidor de producción en $BASE_URL..."
    if [ "$USE_SETSID" -eq 1 ]; then
      setsid env PORT="$PORT" NODE_ENV=production node .output/server/index.mjs >>"$LOG_FILE" 2>&1 &
    else
      env PORT="$PORT" NODE_ENV=production node .output/server/index.mjs >>"$LOG_FILE" 2>&1 &
    fi
  else
    echo "→ Arrancando el servidor de desarrollo en $BASE_URL..."
    if [ "$USE_SETSID" -eq 1 ]; then
      setsid env PORT="$PORT" ./node_modules/.bin/nuxt dev >>"$LOG_FILE" 2>&1 &
    else
      env PORT="$PORT" ./node_modules/.bin/nuxt dev >>"$LOG_FILE" 2>&1 &
    fi
  fi

  SERVER_PID=$!
}

wait_until_ready() {
  local deadline=$((SECONDS + TIMEOUT_SECONDS))

  while ! curl -fsS -o /dev/null --max-time 2 "$BASE_URL/api/health" 2>/dev/null; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "ERROR: el servidor terminó antes de estar listo." >&2
      return 1
    fi

    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "ERROR: el servidor no respondió en ${TIMEOUT_SECONDS}s." >&2
      return 1
    fi

    sleep 1
  done
}

check_page() {
  local code
  code="$(curl -sS -H 'Accept: text/html' -o "$BODY_FILE" -w '%{http_code}' --max-time 10 "$BASE_URL/")"

  if [ "$code" != "200" ]; then
    echo "ERROR: GET / respondió $code (se esperaba 200)." >&2
    return 1
  fi

  if ! grep -qi "$PROJECT_NAME" "$BODY_FILE"; then
    echo "ERROR: GET / no incluye el nombre del proyecto ('$PROJECT_NAME')." >&2
    return 1
  fi

  echo "✓ GET / responde 200 con el nombre del proyecto en el HTML"
}

check_health() {
  local code content_type
  code="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' --max-time 10 "$BASE_URL/api/health")"
  content_type="$(curl -sS -o /dev/null -w '%{content_type}' --max-time 10 "$BASE_URL/api/health")"

  if [ "$code" != "200" ]; then
    echo "ERROR: GET /api/health respondió $code (se esperaba 200)." >&2
    return 1
  fi

  case "$content_type" in
    application/json*) ;;
    *)
      echo "ERROR: GET /api/health devolvió Content-Type '$content_type'." >&2
      return 1
      ;;
  esac

  if ! node -e '
let raw = ""
process.stdin.on("data", (chunk) => (raw += chunk))
process.stdin.on("end", () => {
  const body = JSON.parse(raw)
  if (body.status !== "ok") throw new Error("status distinto de ok")
  if (!body.service) throw new Error("falta service")
  if (!body.version) throw new Error("falta version")
  console.log(`status=${body.status} service=${body.service} version=${body.version}`)
})
' <"$BODY_FILE"; then
    echo "ERROR: el contrato JSON de /api/health no es válido." >&2
    return 1
  fi

  echo "✓ GET /api/health responde 200 con status, service y version"
}

check_not_found() {
  local code content_type
  code="$(curl -sS -H 'Accept: text/html' -o /dev/null -w '%{http_code}' --max-time 10 "$BASE_URL/ruta-inexistente")"
  content_type="$(curl -sS -H 'Accept: text/html' -o /dev/null -w '%{content_type}' --max-time 10 "$BASE_URL/ruta-inexistente")"

  if [ "$code" != "404" ]; then
    echo "ERROR: una ruta inexistente respondió $code (se esperaba 404)." >&2
    return 1
  fi

  case "$content_type" in
    text/html*) ;;
    *)
      echo "ERROR: la página de error no es HTML (Content-Type '$content_type')." >&2
      return 1
      ;;
  esac

  echo "✓ Una ruta inexistente responde 404 con HTML"
}

check_character_page() {
  local code label posture
  code="$(curl -sS -H 'Accept: text/html' -o "$BODY_FILE" -w '%{http_code}' --max-time 10 "$BASE_URL/personaje")"

  if [ "$code" != "200" ]; then
    echo "ERROR: GET /personaje respondió $code (se esperaba 200)." >&2
    return 1
  fi

  for label in "De pie" "Semi de pie" "Semi acostado" "Acostado"; do
    if ! grep -qF "$label" "$BODY_FILE"; then
      echo "ERROR: GET /personaje no incluye la etiqueta '$label'." >&2
      return 1
    fi
  done

  for posture in de-pie semi-de-pie semi-acostado acostado; do
    if ! grep -qF "/characters/personaje-${posture}.png" "$BODY_FILE"; then
      echo "ERROR: GET /personaje no referencia el sprite '$posture'." >&2
      return 1
    fi
  done

  echo "✓ GET /personaje responde 200 con las cuatro posturas y sus sprites"
}

check_terminal_page() {
  local code
  code="$(curl -sS -H 'Accept: text/html' -o "$BODY_FILE" -w '%{http_code}' --max-time 10 "$BASE_URL/terminal")"

  if [ "$code" != "200" ]; then
    echo "ERROR: GET /terminal respondió $code (se esperaba 200)." >&2
    return 1
  fi

  if ! grep -qF "Sleepgame Terminal" "$BODY_FILE"; then
    echo "ERROR: GET /terminal no incluye el texto de arranque 'Sleepgame Terminal'." >&2
    return 1
  fi

  if ! grep -qF "/characters/personaje-de-pie.png" "$BODY_FILE"; then
    echo "ERROR: GET /terminal no referencia el sprite 'de-pie'." >&2
    return 1
  fi

  echo "✓ GET /terminal responde 200 con el texto de arranque y el sprite 'de-pie'"
}

start_server
wait_until_ready
check_page
check_health
check_character_page
check_terminal_page
check_not_found

echo "✓ Verificación '$MODE' completada correctamente"
