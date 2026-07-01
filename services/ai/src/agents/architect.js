const { askModel } = require("../core/modelProvider");

async function architectAgent(request) {
  return askModel({
    system: "Sentinel Nexus Architect AI. Creates building layouts, rooms, floors, and dimensions.",
    prompt: request.prompt,
    context: request.projectContext,
  });
}

module.exports = { architectAgent };
