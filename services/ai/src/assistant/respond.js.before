
const {
  searchWeb,
} = require("./web-search");

const {
  formatWebResults,
} = require("./web-response");

const {
  ASSISTANT_CONFIG,
  capabilitiesText,
} = require("./config");

const {
  searchKnowledge,
  knowledgeStats,
} = require("./knowledge");

const {
  calculateVoltageDrop,
  parseVoltageDropRequest,
} = require("./calculators");

const {
  readProject,
  addProjectNote,
  projectSummary,
} = require("./project-memory");

function normalizePrompt(prompt) {
  return String(prompt || "").trim();
}

function extractWebSearchQuery(prompt) {
  const match = String(prompt || "").match(
    /^(?:search the web for|search online for|look up|research online|web search)\s*[:,-]?\s*(.+)$/is,
  );

  return match?.[1]?.trim() || null;
}

function needsCurrentWebInformation(prompt) {
  return /\b(current|currently|latest|newest|recent|today|updated|firmware|document revision|manual revision|listing status|discontinued|end of life|product page)\b/i.test(
    prompt,
  );
}

function isIntroductionRequest(prompt) {
  return /\b(introduce yourself|who are you)\b/i.test(
    prompt,
  );
}

function isCapabilityRequest(prompt) {
  return /\b(what can you do|what can you assist|how can you help|capabilities)\b/i.test(
    prompt,
  );
}

function isKnowledgeStatusRequest(prompt) {
  return /\b(knowledge status|knowledge base status|what do you know)\b/i.test(
    prompt,
  );
}

function extractRememberCommand(prompt) {
  const match = prompt.match(
    /^(?:remember|save this|add project note)\s*[:,-]?\s*(.+)$/is,
  );

  return match?.[1]?.trim() || null;
}

function compactBlueprintSummary(blueprint) {
  if (!blueprint || typeof blueprint !== "object") {
    return null;
  }

  const rooms = Array.isArray(blueprint.rooms)
    ? blueprint.rooms
    : [];

  const walls = Array.isArray(blueprint.walls)
    ? blueprint.walls
    : [];

  const devices = Array.isArray(blueprint.devices)
    ? blueprint.devices
    : [];

  const doors = Array.isArray(blueprint.doors)
    ? blueprint.doors
    : [];

  return {
    stories:
      Number(blueprint.stories) || undefined,
    roomCount: rooms.length,
    wallCount: walls.length,
    doorCount: doors.length,
    deviceCount: devices.length,
    roomNames: rooms
      .slice(0, 20)
      .map((room) =>
        room.label || room.name || room.id,
      )
      .filter(Boolean),
  };
}

function sourceReferences(results) {
  return results.map((result, index) => ({
    number: index + 1,
    title: result.title,
    source: result.source,
    score: result.score,
  }));
}

function answerFromKnowledge(prompt, results) {
  if (results.length === 0) {
    return [
      `I do not yet have enough verified Sentinel Nexus knowledge to answer "${prompt}" confidently.`,
      "",
      "Add a company procedure, approved design note, manufacturer document summary, or project record to the knowledge folder. I can then retrieve and reference it.",
      "",
      ASSISTANT_CONFIG.disclaimer,
    ].join("\n");
  }

  const sections = results.map(
    (result, index) => {
      const excerpt = result.text
        .replace(/^#{1,4}\s+.+$/m, "")
        .trim()
        .slice(0, 900);

      return [
        `[${index + 1}] ${result.title}`,
        excerpt,
      ].join("\n");
    },
  );

  return [
    "Based on the available Sentinel Nexus knowledge:",
    "",
    ...sections,
    "",
    "Engineering review:",
    "Confirm the actual circuit classification, equipment listing, manufacturer instructions, conductor type, current load, voltage limits, drawing revision, and adopted AHJ requirements before releasing work.",
    "",
    ASSISTANT_CONFIG.disclaimer,
  ].join("\n\n");
}

async function answerFireAlarmQuestion({
  prompt,
  projectId = "default",
  blueprint,
}) {
  const normalizedPrompt = normalizePrompt(prompt);

  if (!normalizedPrompt) {
    return {
      success: false,
      type: "chat",
      error: "A prompt is required.",
    };
  }

  const project = readProject(projectId);

  const explicitWebQuery =
    extractWebSearchQuery(normalizedPrompt);

  if (explicitWebQuery) {
    const searchResponse = await searchWeb(
      explicitWebQuery,
      {
        maxResults: 6,
        trustedOnly: true,
      },
    );

    const formatted =
      formatWebResults(searchResponse);

    return {
      success: formatted.success,
      type: "web-search-response",
      reply: formatted.reply,
      sources: formatted.sources,
      projectId: project.projectId,
    };
  }
  const blueprintSummary =
    compactBlueprintSummary(blueprint);

  if (isIntroductionRequest(normalizedPrompt)) {
    return {
      success: true,
      type: "chat",
      reply:
        `Hello. I am ${ASSISTANT_CONFIG.name}, your ${ASSISTANT_CONFIG.role}. ` +
        "I help organize and analyze fire alarm, low-voltage, blueprint, device-placement, wire-run, inspection, estimating, and as-built information. " +
        ASSISTANT_CONFIG.disclaimer,
      projectId: project.projectId,
    };
  }

  if (isCapabilityRequest(normalizedPrompt)) {
    return {
      success: true,
      type: "chat",
      reply: [
        `I can assist with:`,
        "",
        capabilitiesText(),
        "",
        "For project-specific work, include a project ID, drawing revision, panel model, circuit type, conductor information, device load, route length, and blueprint context whenever available.",
        "",
        ASSISTANT_CONFIG.disclaimer,
      ].join("\n"),
      projectId: project.projectId,
    };
  }

  if (isKnowledgeStatusRequest(normalizedPrompt)) {
    const stats = knowledgeStats();

    return {
      success: true,
      type: "chat",
      reply: [
        `Knowledge files loaded: ${stats.fileCount}`,
        `Knowledge sections loaded: ${stats.chunkCount}`,
        "",
        stats.files.length
          ? stats.files
              .map((file) => `- ${file}`)
              .join("\n")
          : "No knowledge files have been added yet.",
        "",
        projectSummary(project),
      ].join("\n"),
      knowledge: stats,
      projectId: project.projectId,
    };
  }

  const note = extractRememberCommand(
    normalizedPrompt,
  );

  if (note) {
    const updatedProject = addProjectNote(
      projectId,
      note,
    );

    return {
      success: true,
      type: "chat",
      reply:
        `Saved this note under project ${updatedProject.projectId}: "${note}"`,
      project: updatedProject,
    };
  }

  const voltageDropInput =
    parseVoltageDropRequest(normalizedPrompt);

  if (voltageDropInput) {
    const calculation =
      calculateVoltageDrop(voltageDropInput);

    if (!calculation.success) {
      return {
        success: false,
        type: "calculation",
        error: calculation.errors.join(" "),
        calculation,
      };
    }

    const result = calculation.result;

    return {
      success: true,
      type: "voltage-drop-calculation",
      reply: [
        "Preliminary voltage-drop calculation:",
        "",
        `One-way route length: ${calculation.input.oneWayLengthFt} ft`,
        `Round-trip conductor length: ${result.roundTripLengthFt} ft`,
        `Current: ${calculation.input.currentAmps} A`,
        `Conductor: ${calculation.input.wireGaugeAwg} AWG copper`,
        `Source voltage: ${calculation.input.sourceVoltage} VDC`,
        `Calculated circuit resistance: ${result.circuitResistanceOhms} ohms`,
        `Calculated voltage drop: ${result.voltageDropVolts} V`,
        `Calculated voltage drop: ${result.voltageDropPercent}%`,
        `Estimated end voltage: ${result.estimatedEndVoltage} VDC`,
        "",
        calculation.verification,
      ].join("\n"),
      calculation,
      projectId: project.projectId,
    };
  }

  const searchQuery = [
    normalizedPrompt,
    project.systemManufacturer,
    project.panelModel,
  ]
    .filter(Boolean)
    .join(" ");

  const knowledgeResults = searchKnowledge(
    searchQuery,
    {
      limit: 4,
      minimumScore: 3,
    },
  );

  if (
    knowledgeResults.length === 0 &&
    needsCurrentWebInformation(normalizedPrompt)
  ) {
    const searchResponse = await searchWeb(
      normalizedPrompt,
      {
        maxResults: 6,
        trustedOnly: true,
      },
    );

    const formatted =
      formatWebResults(searchResponse);

    return {
      success: formatted.success,
      type: "web-search-response",
      reply: formatted.reply,
      sources: formatted.sources,
      projectId: project.projectId,
      reason:
        "Local knowledge was incomplete and the request required current information.",
    };
  }

  return {
    success: true,
    type: "knowledge-response",
    reply: answerFromKnowledge(
      normalizedPrompt,
      knowledgeResults,
    ),
    projectId: project.projectId,
    projectContext: {
      summary: projectSummary(project),
    },
    blueprintContext: blueprintSummary,
    sources: sourceReferences(
      knowledgeResults,
    ),
  };
}

module.exports = {
  answerFireAlarmQuestion,
};
