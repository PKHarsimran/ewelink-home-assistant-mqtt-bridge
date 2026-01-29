const express = require("express");
const { connectMqtt } = require("./mqtt");
const { discoveryTopic, switchDiscoveryPayload } = require("./discovery");
const { readStore, writeStore } = require("./store");
const { getSimulatedDevices } = require("./devices.simulator");

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const levels = ["trace", "debug", "info", "warn", "error"];

function log(level, msg) {
  if (levels.indexOf(level) >= levels.indexOf(LOG_LEVEL)) {
    console.log(`[${level.toUpperCase()}] ${msg}`);
  }
}

const cfg = {
  mqttHost: process.env.MQTT_HOST || "core-mosquitto",
  mqttPort: Number(process.env.MQTT_PORT || "1883"),
  mqttUsername: process.env.MQTT_USERNAME || "",
  mqttPassword: process.env.MQTT_PASSWORD || "",
  baseTopic: process.env.MQTT_BASE_TOPIC || "ewelink",
  discoveryPrefix: process.env.DISCOVERY_PREFIX || "homeassistant",
  simulator: String(process.env.SIMULATOR || "true") === "true",
  webPort: Number(process.env.WEB_PORT || "8099")
};

function stateTopic(deviceId) {
  return `${cfg.baseTopic}/${deviceId}/state`;
}
function commandTopic(deviceId) {
  return `${cfg.baseTopic}/${deviceId}/set`;
}
function availabilityTopic() {
  return `${cfg.baseTopic}/bridge/status`;
}

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h2>eWeLink Home Assistant MQTT Bridge</h2>
    <p>Status: OK</p>
    <p>Mode: ${cfg.simulator ? "SIMULATOR" : "REAL (not wired yet)"}</p>
    <p>MQTT: ${cfg.mqttHost}:${cfg.mqttPort}</p>
  `);
});

app.get("/health", (req, res) => res.json({ ok: true }));

const mqttClient = connectMqtt({
  host: cfg.mqttHost,
  port: cfg.mqttPort,
  username: cfg.mqttUsername,
  password: cfg.mqttPassword,
  log
});

function publishAvailability(online) {
  mqttClient.publish(availabilityTopic(), online ? "online" : "offline", { retain: true });
}

function persistDeviceState(deviceId, newState) {
  const store = readStore();
  store.devices[deviceId] = { state: newState, updated: new Date().toISOString() };
  writeStore(store);
}

function restorePersistedState(devices) {
  const store = readStore();
  return devices.map((d) => {
    const saved = store.devices[d.id];
    return saved?.state ? { ...d, state: saved.state } : d;
  });
}

function registerDevice(device) {
  const objectId = `ewelink_${device.id}`;
  const configTopic = discoveryTopic(cfg.discoveryPrefix, "switch", objectId);

  const payload = switchDiscoveryPayload({
    name: device.name,
    uniqueId: objectId,
    stateTopic: stateTopic(device.id),
    commandTopic: commandTopic(device.id),
    availabilityTopic: availabilityTopic()
  });

  mqttClient.publish(configTopic, JSON.stringify(payload), { retain: true });
  mqttClient.publish(stateTopic(device.id), device.state, { retain: true });

  mqttClient.subscribe(commandTopic(device.id));
  log("info", `Registered ${device.name} (discovery + state + commands)`);
}

mqttClient.on("connect", () => {
  publishAvailability(true);

  let devices = cfg.simulator ? getSimulatedDevices() : [];
  devices = restorePersistedState(devices);

  devices.forEach(registerDevice);

  mqttClient.on("message", (topic, payloadBuf) => {
    const payload = payloadBuf.toString().trim().toUpperCase();
    const match = topic.match(new RegExp(`^${cfg.baseTopic}/(.+)/set$`));
    if (!match) return;

    const deviceId = match[1];
    if (payload !== "ON" && payload !== "OFF") {
      log("warn", `Invalid payload for ${deviceId}: ${payload}`);
      return;
    }

    // Simulator: apply immediately. Real mode later calls eWeLink cloud.
    persistDeviceState(deviceId, payload);
    mqttClient.publish(stateTopic(deviceId), payload, { retain: true });
    log("info", `Command applied ${deviceId} -> ${payload}`);
  });

  setInterval(() => publishAvailability(true), 30_000);
});

process.on("SIGTERM", () => {
  publishAvailability(false);
  process.exit(0);
});

app.listen(cfg.webPort, () => log("info", `Ingress web listening on :${cfg.webPort}`));
