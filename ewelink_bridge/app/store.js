const fs = require("fs");
const path = require("path");

const DATA_DIR = "/data";
const FILE = path.join(DATA_DIR, "store.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ devices: {} }, null, 2));
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function writeStore(obj) {
  ensureStore();
  fs.writeFileSync(FILE, JSON.stringify(obj, null, 2));
}

module.exports = { readStore, writeStore };
