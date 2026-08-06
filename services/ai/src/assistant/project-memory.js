const fs = require("fs");
const path = require("path");

const PROJECT_DIRECTORY = path.resolve(
  __dirname,
  "../../data/projects",
);

function ensureProjectDirectory() {
  fs.mkdirSync(PROJECT_DIRECTORY, {
    recursive: true,
  });
}

function sanitizeProjectId(projectId) {
  const value = String(
    projectId || "default",
  ).trim();

  return (
    value
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) ||
    "default"
  );
}

function projectFilePath(projectId) {
  ensureProjectDirectory();

  return path.join(
    PROJECT_DIRECTORY,
    `${sanitizeProjectId(projectId)}.json`,
  );
}

function emptyProject(projectId) {
  return {
    projectId: sanitizeProjectId(projectId),
    name: "",
    building: "",
    address: "",
    systemManufacturer: "",
    panelModel: "",
    drawingRevision: "",
    notes: [],
    wireRuns: [],
    devices: [],
    inspections: [],
    updatedAt: new Date().toISOString(),
  };
}

function readProject(projectId) {
  const filePath = projectFilePath(projectId);

  if (!fs.existsSync(filePath)) {
    return emptyProject(projectId);
  }

  try {
    return JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    );
  } catch (error) {
    console.error(
      `Could not read project ${projectId}:`,
      error,
    );

    return emptyProject(projectId);
  }
}

function writeProject(projectId, projectData) {
  const filePath = projectFilePath(projectId);

  const savedProject = {
    ...emptyProject(projectId),
    ...projectData,
    projectId: sanitizeProjectId(projectId),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    filePath,
    JSON.stringify(savedProject, null, 2) + "\n",
    "utf8",
  );

  return savedProject;
}

function addProjectNote(projectId, note) {
  const project = readProject(projectId);

  project.notes = Array.isArray(project.notes)
    ? project.notes
    : [];

  project.notes.push({
    id: `note-${Date.now()}`,
    text: String(note).trim(),
    createdAt: new Date().toISOString(),
  });

  return writeProject(projectId, project);
}

function addWireRun(projectId, wireRun) {
  const project = readProject(projectId);

  project.wireRuns = Array.isArray(
    project.wireRuns,
  )
    ? project.wireRuns
    : [];

  project.wireRuns.push({
    id:
      wireRun.id ||
      `wire-run-${Date.now()}`,
    status: "planning",
    ...wireRun,
    createdAt:
      wireRun.createdAt ||
      new Date().toISOString(),
  });

  return writeProject(projectId, project);
}

function projectSummary(project) {
  if (!project) {
    return "No project context is available.";
  }

  const notes = Array.isArray(project.notes)
    ? project.notes
    : [];

  const wireRuns = Array.isArray(
    project.wireRuns,
  )
    ? project.wireRuns
    : [];

  return [
    `Project ID: ${project.projectId || "unknown"}`,
    `Name: ${project.name || "not provided"}`,
    `Building: ${project.building || "not provided"}`,
    `Panel: ${
      project.panelModel ||
      project.systemManufacturer ||
      "not provided"
    }`,
    `Drawing revision: ${
      project.drawingRevision ||
      "not provided"
    }`,
    `Saved notes: ${notes.length}`,
    `Saved wire runs: ${wireRuns.length}`,
  ].join("\n");
}

module.exports = {
  readProject,
  writeProject,
  addProjectNote,
  addWireRun,
  projectSummary,
  sanitizeProjectId,
};
