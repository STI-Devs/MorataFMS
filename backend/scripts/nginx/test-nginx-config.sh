#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMP_DIR="${SCRIPT_DIR}/.nginx-test"
TEMPLATE_PATH="${BACKEND_ROOT}/docker/nginx/default.conf"
RENDERED_SERVER_PATH="${TEMP_DIR}/default.rendered.conf"
MAIN_CONFIG_PATH="${TEMP_DIR}/nginx.test.conf"
DOCKER_TEMP_DIR="${TEMP_DIR}"

if command -v cygpath >/dev/null 2>&1; then
    DOCKER_TEMP_DIR="$(cygpath -m "${TEMP_DIR}")"
fi

mkdir -p "${TEMP_DIR}"

export PORT
envsubst '${PORT}' < "${TEMPLATE_PATH}" > "${RENDERED_SERVER_PATH}"
sed -i 's@include fastcgi_params;@include /etc/nginx/fastcgi_params;@' "${RENDERED_SERVER_PATH}"

cat > "${MAIN_CONFIG_PATH}" <<EOF
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    include       /etc/nginx/codex-test/default.rendered.conf;
}
EOF

MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" docker run --rm \
    -v "${DOCKER_TEMP_DIR}:/etc/nginx/codex-test:ro" \
    nginx:1.27 \
    nginx -c /etc/nginx/codex-test/nginx.test.conf -t
