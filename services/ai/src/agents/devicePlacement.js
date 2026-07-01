const { suggestDevicePlacement } = require("../cad/devicePlacement");

async function devicePlacementAgent(request) {
  return suggestDevicePlacement(request.blueprint, request.projectContext);
}

module.exports = { devicePlacementAgent };
