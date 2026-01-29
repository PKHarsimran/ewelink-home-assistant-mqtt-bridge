const mqtt = require("mqtt");

function connectMqtt({ host, port, username, password, log }) {
  const url = `mqtt://${host}:${port}`;
  const opts = {};

  if (username) opts.username = username;
  if (password) opts.password = password;

  const client = mqtt.connect(url, opts);

  client.on("connect", () => log("info", `MQTT connected: ${url}`));
  client.on("reconnect", () => log("warn", "MQTT reconnecting..."));
  client.on("error", (err) => log("error", `MQTT error: ${err.message}`));

  return client;
}

module.exports = { connectMqtt };
