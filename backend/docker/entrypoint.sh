#!/usr/bin/env sh
set -eu

APP_ROOT="/var/www/html"
PORT="${PORT:-8000}"
LARAVEL_RUNTIME_CACHE="${LARAVEL_RUNTIME_CACHE:-true}"
export PORT

log() {
    printf '%s\n' "$1"
}

run_artisan() {
    php artisan "$@" --no-interaction
}

if [ -f /host/backend/.env.docker ] && [ ! -e "${APP_ROOT}/.env" ]; then
    ln -sf /host/backend/.env.docker "${APP_ROOT}/.env"
elif [ -f /host/backend/.env.docker.example ] && [ ! -e "${APP_ROOT}/.env" ]; then
    ln -sf /host/backend/.env.docker.example "${APP_ROOT}/.env"
fi

mkdir -p \
    "${APP_ROOT}/bootstrap/cache" \
    "${APP_ROOT}/storage/app" \
    "${APP_ROOT}/storage/framework/cache" \
    "${APP_ROOT}/storage/framework/sessions" \
    "${APP_ROOT}/storage/framework/testing" \
    "${APP_ROOT}/storage/framework/views" \
    "${APP_ROOT}/storage/logs" \
    /run/php

chown -R www-data:www-data "${APP_ROOT}/bootstrap/cache" "${APP_ROOT}/storage" /run/php

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

cd "${APP_ROOT}"

case "${LARAVEL_RUNTIME_CACHE}" in
    1|true|TRUE|yes|YES)
        log "Preparing Laravel runtime caches..."
        run_artisan config:clear
        run_artisan route:clear
        run_artisan config:cache
        run_artisan route:cache
        log "Laravel runtime caches are ready."
        ;;
    *)
        log "Skipping Laravel runtime caches."
        run_artisan config:clear
        run_artisan route:clear
        ;;
esac

exec "$@"
