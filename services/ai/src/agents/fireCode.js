const { askModel } = require("../core/modelProvider");
const { searchKnowledgeBase } = require("../knowledge/search");

async function fireCodeAgent(request) {
  const references = await searchKnowledgeBase(request.prompt);

  return askModel({
    system:
      "Sentinel Nexus Fire Code AI. Reviews fire alarm design and gives NFPA-style guidance. Always require AHJ verification.",
    prompt: request.prompt,
    context: { project: request.projectContext, references },
  });
}

module.exports = { fireCodeAgent };
