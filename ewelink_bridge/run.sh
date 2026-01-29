#!/usr/bin/with-contenv bashio
set -e

export LOG_LEVEL="$(bashio::config 'log_level')"

export MQTT_HOST="$(bashio::config 'mqtt_host')"
export MQTT_PORT="$(bashio::config 'mqtt_port')"
export MQTT_USERNAME="$(bashio::config 'mqtt_username')"
export MQTT_PASSWORD="$(bashio::config 'mqtt_password')"
export MQTT_BASE_TOPIC="$(bashio::config 'mqtt_base_topic')"
export DISCOVERY_PREFIX="$(bashio::config 'discovery_prefix')"

export SIMULATOR="$(bashio::config 'simulator')"
export WEB_PORT="8099"

bashio::log.info "Starting eWeLink MQTT Bridge (simulator=${SIMULATOR})..."
exec node /app/server.js
