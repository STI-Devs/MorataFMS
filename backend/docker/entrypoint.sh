#!/usr/bin/env sh
set -eu

PORT="${PORT:-8000}"
export PORT

if [ -f /host/backend/.env.docker ] && [ ! -e /var/www/html/.env ]; then
    ln -sf /host/backend/.env.docker /var/www/html/.env
elif [ -f /host/backend/.env.docker.example ] && [ ! -e /var/www/html/.env ]; then
    ln -sf /host/backend/.env.docker.example /var/www/html/.env
fi

mkdir -p \
    /var/www/html/bootstrap/cache \
    /var/www/html/storage/app \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/testing \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /run/php

chown -R www-data:www-data /var/www/html/bootstrap/cache /var/www/html/storage /run/php

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
