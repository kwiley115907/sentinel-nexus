const { estimateMaterials } = require("../estimating/materialEstimator");

async function materialEstimatorAgent(request) {
  return estimateMaterials(request.blueprint, request.projectContext);
}

module.exports = { materialEstimatorAgent };
