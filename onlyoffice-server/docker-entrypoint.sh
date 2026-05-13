#!/bin/bash

set -euo pipefail

normalize_env() {
  local name="$1"
  local value="${!name-}"

  if [[ -z "${value}" ]]; then
    return
  fi

  if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
    value="${value:1:${#value}-2}"
  fi

  printf -v "${name}" '%s' "${value}"
  export "${name}"
}

for env_name in COMPANY_NAME JWT_ENABLED JWT_SECRET JWT_HEADER ADMINPANEL_ENABLED EXAMPLE_ENABLED; do
  normalize_env "${env_name}"
done

export COMPANY_NAME="${COMPANY_NAME:-onlyoffice}"
export JWT_ENABLED="${JWT_ENABLED:-true}"
export ADMINPANEL_ENABLED=false
export EXAMPLE_ENABLED=false

patch_upstream_entrypoint() {
  local entrypoint="/app/ds/run-document-server.sh"

  if [ ! -f "${entrypoint}" ]; then
    return
  fi

  if ! grep -q "morata nginx diagnostics" "${entrypoint}"; then
    perl -0pi -e 's/DOCKER_CONTAINER_ID=\$\(basename \$\(cat \/proc\/1\/cpuset\)\)/DOCKER_CONTAINER_ID=\$\(hostname\)/g' "${entrypoint}"
    perl -0pi -e 's/service nginx start/# morata nginx diagnostics\nif ! service nginx start; then\n  echo "nginx start failed; running diagnostics" \>\&2\n  nginx -t \>\&2 \|\| true\n  echo "--- nginx.conf ---" \>\&2\n  sed -n '\''1,240p'\'' \/etc\/nginx\/nginx.conf \>\&2 \|\| true\n  echo "--- nginx files ---" \>\&2\n  find \/etc\/nginx -maxdepth 4 -type f \| sort \>\&2 \|\| true\n  echo "--- nginx error log ---" \>\&2\n  cat \/var\/log\/nginx\/error.log \>\&2 \|\| true\n  exit 1\nfi/g' "${entrypoint}"
  fi
}

patch_upstream_entrypoint

app_root="/var/www/${COMPANY_NAME}"
data_root="${app_root}/Data"
log_root="/var/log/${COMPANY_NAME}"
lib_root="/var/lib/${COMPANY_NAME}"

mkdir -p \
  "${data_root}/certs" \
  "${data_root}/.private" \
  /var/log/nginx \
  "${log_root}/documentserver/adminpanel" \
  "${log_root}/documentserver/converter" \
  "${log_root}/documentserver/docservice" \
  "${log_root}/documentserver/metrics" \
  "${log_root}/documentserver/example" \
  "${log_root}/documentserver-example" \
  "${lib_root}/documentserver/App_Data/cache/files" \
  "${lib_root}/documentserver/App_Data/docbuilder" \
  "${lib_root}/documentserver-example/files"

touch \
  /var/log/nginx/access.log \
  /var/log/nginx/error.log \
  "${log_root}/documentserver/adminpanel/out.log" \
  "${log_root}/documentserver/adminpanel/err.log" \
  "${log_root}/documentserver/converter/out.log" \
  "${log_root}/documentserver/converter/err.log" \
  "${log_root}/documentserver/docservice/out.log" \
  "${log_root}/documentserver/docservice/err.log" \
  "${log_root}/documentserver/metrics/out.log" \
  "${log_root}/documentserver/metrics/err.log" \
  "${log_root}/documentserver/example/out.log" \
  "${log_root}/documentserver/example/err.log" \
  "${log_root}/documentserver-example/out.log" \
  "${log_root}/documentserver-example/err.log"

if [ -d /etc/supervisor/conf.d ]; then
  find /etc/supervisor/conf.d -maxdepth 1 -type f -name '*.conf' -exec sed -i "s/COMPANY_NAME/${COMPANY_NAME}/g" {} +
  rm -f /etc/supervisor/conf.d/ds-adminpanel.conf
  rm -f /etc/supervisor/conf.d/ds-example.conf
  if [ -f /etc/supervisor/conf.d/ds.conf ]; then
    sed -i 's/,example//g; s/,adminpanel//g' /etc/supervisor/conf.d/ds.conf
  fi
fi

if [ -f /etc/nginx/includes/ds-example.conf ]; then
  : > /etc/nginx/includes/ds-example.conf
fi

if [ ! -x /app/ds/run-document-server.sh ]; then
  echo "Missing upstream ONLYOFFICE entrypoint: /app/ds/run-document-server.sh" >&2
  exit 1
fi

exec /app/ds/run-document-server.sh
