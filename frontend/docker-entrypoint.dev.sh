#!/bin/sh
set -e
# When source is mounted over /app, ensure dependencies match package-lock.json.
# The named Docker volume for node_modules can stay stale after new deps are added;
# comparing a checksum of the lockfile forces npm ci when the lockfile changes.

LOCK_SHA=""
if command -v sha256sum >/dev/null 2>&1; then
  LOCK_SHA=$(sha256sum package-lock.json 2>/dev/null | cut -d' ' -f1)
fi

RUN_CI=false
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  RUN_CI=true
elif [ -n "$LOCK_SHA" ]; then
  STORED=$(cat node_modules/.vellon-lock-checksum 2>/dev/null || true)
  if [ "$STORED" != "$LOCK_SHA" ]; then
    RUN_CI=true
  fi
elif [ -f package-lock.json ] && [ -d node_modules ] && [ package-lock.json -nt node_modules ]; then
  RUN_CI=true
fi
# Catch missing packages (e.g. volume from before a dependency was added)
if [ "$RUN_CI" != true ] && [ -d node_modules ] && [ -f package-lock.json ]; then
  if ! node -e "require.resolve('next')" 2>/dev/null; then
    RUN_CI=true
  fi
fi

if [ "$RUN_CI" = true ]; then
  npm ci
  if [ -n "$LOCK_SHA" ]; then
    echo "$LOCK_SHA" > node_modules/.vellon-lock-checksum
  fi
fi

if [ -n "$NEXT_DEV_USE_WEBPACK" ]; then
  exec npx next dev --webpack
fi
exec npm run dev
