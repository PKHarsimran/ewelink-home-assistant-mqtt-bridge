function discoveryTopic(discoveryPrefix, component, objectId) {
  return `${discoveryPrefix}/${component}/${objectId}/config`;
}

function switchDiscoveryPayload({ name, uniqueId, stateTopic, commandTopic, availabilityTopic }) {
  return {
    name,
    uniq_id: uniqueId,
    stat_t: stateTopic,
    cmd_t: commandTopic,
    avty_t: availabilityTopic,
    pl_on: "ON",
    pl_off: "OFF",
    dev: {
      ids: [uniqueId],
      name: "eWeLink MQTT Bridge",
      mf: "Community",
      mdl: "Cloud-first"
    }
  };
}

module.exports = { discoveryTopic, switchDiscoveryPayload };
