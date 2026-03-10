#!/bin/sh
set -e
# When source is mounted over /app, ensure dependencies are installed so the dev server
# does not hit "Module not found" and crash (e.g. after first run or package.json/lockfile change).
# Run npm ci when: node_modules missing/empty, lockfile newer than node_modules, or key deps missing.
RUN_CI=false
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  RUN_CI=true
elif [ -f package-lock.json ] && [ -d node_modules ] && [ package-lock.json -nt node_modules ]; then
  RUN_CI=true
fi
if [ "$RUN_CI" = true ]; then
  npm ci
fi
# Optional: set NEXT_DEV_USE_WEBPACK=1 in frontend env to use webpack instead of Turbopack if dev server restarts (e.g. on /signin compile).
if [ -n "$NEXT_DEV_USE_WEBPACK" ]; then
  exec npx next dev --webpack
fi
exec npm run dev
