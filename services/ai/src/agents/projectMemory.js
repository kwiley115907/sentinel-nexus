const { getProjectMemory, saveProjectMemory } = require("../memory/projectMemory");

async function projectMemoryAgent(request) {
  if (request.projectContext) {
    saveProjectMemory(request.projectId || "default", request.projectContext);
  }

  return getProjectMemory(request.projectId || "default");
}

module.exports = { projectMemoryAgent };
