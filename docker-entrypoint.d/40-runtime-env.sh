#!/bin/sh

set -eu

placeholder='__BASE_URL__'
base_url=${BASE_URL:-}

if [ -z "$base_url" ]; then
  echo 'BASE_URL não foi definida.' >&2
  exit 1
fi

escaped_base_url=$(printf '%s' "$base_url" | sed 's/[\/&]/\\&/g')

find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.js' \) \
  -exec sed -i "s/${placeholder}/${escaped_base_url}/g" {} +
