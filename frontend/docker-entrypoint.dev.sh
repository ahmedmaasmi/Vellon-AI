#!/bin/sh
set -e
# When source is mounted over /app, ensure dependencies are installed (e.g. after first run or package.json change).
# Also run when node_modules volume is empty (e.g. after adding a new dependency and removing the volume).
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  npm ci
fi
exec npm run dev
