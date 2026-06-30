#!/bin/sh

set -eu

placeholder='__EXPO_PUBLIC_API_BASE_URL__'
api_base_url=${EXPO_PUBLIC_API_BASE_URL:-}
api_proxy_origin=${API_PROXY_ORIGIN:-}

if [ -z "$api_base_url" ]; then
  echo 'EXPO_PUBLIC_API_BASE_URL não foi definida.' >&2
  exit 1
fi

if [ -z "$api_proxy_origin" ]; then
  echo 'API_PROXY_ORIGIN não foi definida.' >&2
  exit 1
fi

escaped_api_base_url=$(printf '%s' "$api_base_url" | sed 's/[\/&]/\\&/g')
escaped_api_proxy_origin=$(printf '%s' "$api_proxy_origin" | sed 's/[\/&]/\\&/g')

find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.js' \) \
  -exec sed -i "s/${placeholder}/${escaped_api_base_url}/g" {} +

sed -i "s/__API_PROXY_ORIGIN__/${escaped_api_proxy_origin}/g" /etc/nginx/conf.d/default.conf
