const { searchKnowledgeBase } = require("../knowledge/search");

async function knowledgeSearchAgent(request) {
  return searchKnowledgeBase(request.prompt);
}

module.exports = { knowledgeSearchAgent };
