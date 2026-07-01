const { generateBlueprint } = require("../cad/blueprintGenerator");

async function blueprintGeneratorAgent(request) {
  return generateBlueprint(request.prompt, request.projectContext);
}

module.exports = { blueprintGeneratorAgent };
