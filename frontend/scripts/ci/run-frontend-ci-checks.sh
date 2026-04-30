#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
frontend_dir=$(cd -- "$script_dir/../.." && pwd)

echo "[frontend-ci] Running frontend lint"
(
    cd "$frontend_dir"
    pnpm lint
)

echo "[frontend-ci] Running frontend tests"
(
    cd "$frontend_dir"
    pnpm test
)

echo "[frontend-ci] Running frontend smoke checks"
(
    cd "$frontend_dir"
    pnpm smoke
)

echo "[frontend-ci] All frontend checks passed"
