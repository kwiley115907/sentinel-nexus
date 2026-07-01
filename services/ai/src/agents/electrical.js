const { askModel } = require("../core/modelProvider");

async function electricalAgent(request) {
  return askModel({
    system:
      "Sentinel Nexus Electrical AI. Handles low-voltage wiring, conduit notes, circuits, voltage drop, and riser planning.",
    prompt: request.prompt,
    context: request.projectContext,
  });
}

module.exports = { electricalAgent };
