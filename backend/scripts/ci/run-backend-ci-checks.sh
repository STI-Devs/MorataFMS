#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
backend_dir=$(cd -- "$script_dir/../.." && pwd)
repo_root=$(cd -- "$backend_dir/.." && pwd)

echo "[backend-ci] Running backend tests"
(
    cd "$backend_dir"
    php artisan test --compact
)

echo "[backend-ci] Validating Docker Compose configuration"
(
    cd "$repo_root"
    docker compose config > /dev/null
)

echo "[backend-ci] Validating nginx template syntax"
(
    cd "$backend_dir"
    bash scripts/nginx/test-nginx-config.sh
)

echo "[backend-ci] Building backend image"
(
    cd "$repo_root"
    docker build -f backend/Dockerfile -t morata-backend:prepush backend
)

echo "[backend-ci] Verifying runtime image excludes local scripts"
docker run --rm morata-backend:prepush sh -lc 'test ! -d /var/www/html/scripts'

echo "[backend-ci] All backend checks passed"
