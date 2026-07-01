const memory = new Map();

function saveProjectMemory(projectId, context) {
  memory.set(projectId, {
    projectId,
    updatedAt: new Date().toISOString(),
    context,
  });
}

function getProjectMemory(projectId) {
  return (
    memory.get(projectId) || {
      projectId,
      updatedAt: null,
      context: {},
    }
  );
}

module.exports = { saveProjectMemory, getProjectMemory };
