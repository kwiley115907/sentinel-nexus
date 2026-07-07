const express = require("express");
const cors = require("cors");
const { z } = require("zod");
const { searchCodeDocs } = require("./qdrant");

const app = express();
app.use(cors());
app.use(express.json());

const agents = {
  architect: {
    model: "qwen2.5:7b",
    system: "You are Sentinel Nexus Architect AI. Generate building layouts, floors, rooms, dimensions, and building sections in JSON only.",
  },
  fireCode: {
    model: "qwen2.5:7b",
    system: "You are Sentinel Nexus Fire Code AI. Help with fire alarm layouts, NFPA-style reasoning, device placement, and code review. Do not claim legal certification.",
  },
  electrical: {
    model: "qwen2.5:7b",
    system: "You are Sentinel Nexus Electrical AI. Generate low-voltage wiring, conduit notes, voltage drop notes, panel/device planning, and material takeoffs.",
  },
  estimator: {
    model: "qwen2.5:7b",
    system: "You are Sentinel Nexus Estimator AI. Create device counts, cable estimates, labor estimates, and material takeoffs.",
  },
};

const requestSchema = z.object({
  agent: z.enum(["architect", "fireCode", "electrical", "estimator"]),
  prompt: z.string().min(5),
  project: z.any().optional(),
});

async function askOllama(agent, prompt, project) {
  const profile = agents[agent];
  const codeContext = agent === "fireCode" ? await searchCodeDocs(prompt) : null;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: profile.model,
      stream: false,
      prompt: `
${profile.system}

Return valid JSON only. No markdown.

Project context:
${JSON.stringify(project || {}, null, 2)}

Reference context:
${JSON.stringify(codeContext || {}, null, 2)}

User request:
${prompt}
`,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.response);
}

app.post("/ai", async (req, res) => {
  try {
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid Sentinel Nexus AI request." });
    }

    const result = await askOllama(
      parsed.data.agent,
      parsed.data.prompt,
      parsed.data.project,
    );

    return res.json({ agent: parsed.data.agent, result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Sentinel Nexus AI failed.",
    });
  }
});

app.post("/generate-building", async (req, res) => {
  try {
    const result = await askOllama("architect", req.body.prompt, req.body.project);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Building generator failed.",
    });
  }
});

app.listen(8787, () => {
  console.log("Sentinel Nexus AI running on http://localhost:8787");
});
