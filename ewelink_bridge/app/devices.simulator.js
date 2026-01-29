function getSimulatedDevices() {
  return [
    { id: "sim_1", name: "Sim Lamp", type: "switch", state: "OFF" },
    { id: "sim_2", name: "Sim Fan", type: "switch", state: "ON" }
  ];
}

module.exports = { getSimulatedDevices };
