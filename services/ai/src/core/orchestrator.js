const { architectAgent } = require("../agents/architect");
const { fireCodeAgent } = require("../agents/fireCode");
const { electricalAgent } = require("../agents/electrical");
const { blueprintGeneratorAgent } = require("../agents/blueprintGenerator");
const { blueprintReviewAgent } = require("../agents/blueprintReview");
const { devicePlacementAgent } = require("../agents/devicePlacement");
const { materialEstimatorAgent } = require("../agents/materialEstimator");
const { cadEditAgent } = require("../agents/cadEdit");
const { projectMemoryAgent } = require("../agents/projectMemory");
const { knowledgeSearchAgent } = require("../agents/knowledgeSearch");

const agentMap = {
  architect: architectAgent,
  "fire-code": fireCodeAgent,
  electrical: electricalAgent,
  "blueprint-generator": blueprintGeneratorAgent,
  "blueprint-review": blueprintReviewAgent,
  "device-placement": devicePlacementAgent,
  "material-estimate": materialEstimatorAgent,
  "cad-edit": cadEditAgent,
  "project-memory": projectMemoryAgent,
  "knowledge-search": knowledgeSearchAgent,
};

async function orchestrateAiRequest(request) {
  const agent = agentMap[request.requestType];

  if (!agent) {
    throw new Error(`No Sentinel Nexus AI agent found for ${request.requestType}`);
  }

  return agent(request);
}

module.exports = { orchestrateAiRequest };
