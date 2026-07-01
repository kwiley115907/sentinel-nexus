const { reviewBlueprint } = require("../cad/blueprintReview");

async function blueprintReviewAgent(request) {
  return reviewBlueprint(request.blueprint);
}

module.exports = { blueprintReviewAgent };
