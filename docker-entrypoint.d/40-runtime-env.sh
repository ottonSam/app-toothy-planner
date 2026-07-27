#!/bin/sh

set -eu

placeholder='__BASE_URL__'
base_url=${BASE_URL:-}
runtime_config='/usr/share/nginx/html/runtime-config.js'

if [ -z "$base_url" ]; then
  echo 'BASE_URL não foi definida.' >&2
  exit 1
fi

case "$base_url" in
  http://* | https://*) ;;
  *)
    echo 'BASE_URL deve ser uma URL absoluta iniciada por http:// ou https://.' >&2
    exit 1
    ;;
esac

if [ ! -f "$runtime_config" ]; then
  echo 'Arquivo de configuração da aplicação não foi encontrado.' >&2
  exit 1
fi

escaped_base_url=$(printf '%s' "$base_url" | sed 's/[\/&]/\\&/g')

sed -i "s/${placeholder}/${escaped_base_url}/g" "$runtime_config"

if grep -q "$placeholder" "$runtime_config"; then
  echo 'Não foi possível aplicar BASE_URL à configuração da aplicação.' >&2
  exit 1
fi

echo "API configurada em ${base_url}"
