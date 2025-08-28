#!/bin/sh

# Replace 'listen 80' with 'listen $PORT' in the nginx config
# The PORT variable is automatically set by Cloud Run.
sed -i -e 's/listen 80/listen '$PORT'/' /etc/nginx/conf.d/default.conf

# Start Nginx in the foreground
nginx -g 'daemon off;'