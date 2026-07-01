const { createCadActions } = require("../cad/cadActions");

async function cadEditAgent(request) {
  return createCadActions(request.prompt, request.blueprint);
}

module.exports = { cadEditAgent };
