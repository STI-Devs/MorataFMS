FROM php:8.4-fpm-bookworm AS base

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        curl \
        gettext-base \
        git \
        libicu-dev \
        nginx \
        supervisor \
        unzip \
    && docker-php-ext-install -j"$(nproc)" bcmath intl opcache pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM base AS vendor

COPY backend/ /var/www/html/

RUN mkdir -p bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/logs \
    && cp .env.example .env \
    && composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    && rm -f .env \
    && rm -rf /tmp/composer

FROM base AS runtime

COPY backend/ /var/www/html/
COPY --from=vendor /var/www/html/vendor /var/www/html/vendor
COPY backend/docker/nginx/default.conf /etc/nginx/templates/default.conf.template
COPY backend/docker/php/app.ini /usr/local/etc/php/conf.d/99-app.ini
COPY backend/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf \
    && mkdir -p /run/php /var/log/supervisor /etc/nginx/templates \
        /var/www/html/bootstrap/cache \
        /var/www/html/storage/framework/cache \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/testing \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
    && printf '%s\n' \
        '#!/usr/bin/env sh' \
        'set -eu' \
        '' \
        'PORT="${PORT:-8000}"' \
        'export PORT' \
        '' \
        'if [ -f /host/backend/.env.docker ] && [ ! -e /var/www/html/.env ]; then' \
        '    ln -sf /host/backend/.env.docker /var/www/html/.env' \
        'elif [ -f /host/backend/.env.docker.example ] && [ ! -e /var/www/html/.env ]; then' \
        '    ln -sf /host/backend/.env.docker.example /var/www/html/.env' \
        'fi' \
        '' \
        'mkdir -p \' \
        '    /var/www/html/bootstrap/cache \' \
        '    /var/www/html/storage/app \' \
        '    /var/www/html/storage/framework/cache \' \
        '    /var/www/html/storage/framework/sessions \' \
        '    /var/www/html/storage/framework/testing \' \
        '    /var/www/html/storage/framework/views \' \
        '    /var/www/html/storage/logs \' \
        '    /run/php' \
        '' \
        'chown -R www-data:www-data /var/www/html/bootstrap/cache /var/www/html/storage /run/php' \
        '' \
        'envsubst '"'"'${PORT}'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' \
        '' \
        'exec "$@"' \
        > /usr/local/bin/entrypoint \
    && chmod +x /usr/local/bin/entrypoint

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
