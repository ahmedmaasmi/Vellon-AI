#!/bin/sh
set -e
# When source is mounted over /app, ensure dependencies are installed (e.g. after first run or package.json change)
if [ ! -d node_modules ]; then
  npm ci
fi
exec npm run dev
