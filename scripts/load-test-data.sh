#!/usr/bin/env sh
set -eu

LOGARYS_CONSOLE_API_URL="${LOGARYS_CONSOLE_API_URL:-http://localhost:3002}" \
LOGARYS_INGESTOR_API_URL="${LOGARYS_INGESTOR_API_URL:-http://localhost:3000}" \
node scripts/load-test-data.mjs
