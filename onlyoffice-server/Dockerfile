ARG ONLYOFFICE_TAG=9.3.1.2
FROM onlyoffice/documentserver:${ONLYOFFICE_TAG}

ENV COMPANY_NAME=onlyoffice \
    JWT_ENABLED=true \
    ADMINPANEL_ENABLED=false \
    EXAMPLE_ENABLED=false

COPY docker-entrypoint.sh /usr/local/bin/morata-onlyoffice-entrypoint.sh

RUN set -eux; \
    rm -f /etc/supervisor/conf.d/ds-adminpanel.conf; \
    if [ -f /etc/supervisor/conf.d/ds.conf ]; then \
        sed -i 's/,adminpanel//g' /etc/supervisor/conf.d/ds.conf; \
    fi; \
    rm -f /etc/supervisor/conf.d/ds-example.conf; \
    rm -f /etc/nginx/includes/ds-example.conf; \
    rm -rf /var/www/onlyoffice/documentserver-example; \
    rm -rf /etc/onlyoffice/documentserver-example; \
    chmod 755 /usr/local/bin/morata-onlyoffice-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/morata-onlyoffice-entrypoint.sh"]
