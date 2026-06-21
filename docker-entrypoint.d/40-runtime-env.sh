#!/bin/sh

set -eu

placeholder='__EXPO_PUBLIC_API_BASE_URL__'
api_base_url=${EXPO_PUBLIC_API_BASE_URL:-}

if [ -z "$api_base_url" ]; then
  echo 'EXPO_PUBLIC_API_BASE_URL não foi definida.' >&2
  exit 1
fi

escaped_api_base_url=$(printf '%s' "$api_base_url" | sed 's/[\/&]/\\&/g')

find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.js' \) \
  -exec sed -i "s/${placeholder}/${escaped_api_base_url}/g" {} +
