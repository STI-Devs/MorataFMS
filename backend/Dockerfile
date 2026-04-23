FROM php:8.4.20-fpm-bookworm AS php-ext-build

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        gettext-base \
        libicu-dev \
    && docker-php-ext-install -j"$(nproc)" bcmath intl opcache pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

FROM php-ext-build AS vendor

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        git \
        unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock /var/www/html/

RUN mkdir -p bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/logs \
    && composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --no-scripts \
    --no-autoloader

COPY . /var/www/html/

RUN cp .env.example .env \
    && composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && rm -f .env \
    && rm -rf /tmp/composer

FROM php:8.4.20-fpm-bookworm AS runtime

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        gettext-base \
        libicu72 \
        nginx \
        supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html/
COPY --from=vendor /var/www/html/vendor /var/www/html/vendor
COPY --from=php-ext-build /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=php-ext-build /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
COPY docker/nginx/default.conf /etc/nginx/templates/default.conf.template
COPY docker/php/app.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf \
    && mkdir -p /run/php /var/log/supervisor /etc/nginx/templates \
        /var/www/html/bootstrap/cache \
        /var/www/html/storage/framework/cache \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/testing \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
    && chmod +x /usr/local/bin/entrypoint

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
