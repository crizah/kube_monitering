#!bin/bash


set -e

envsubst '${BACKEND_URL}' < /usr/share/nginx/html/config.js > /tmp/config.js
mv /tmp/config.js /usr/shar/nginx/html/config.js


exec nginx -g 'daemon off;'

