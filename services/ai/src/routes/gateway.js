const express = require("express");
const { z } = require("zod");
const { orchestrateAiRequest } = require("../core/orchestrator");

const gatewayRouter = express.Router();

const gatewaySchema = z.object({
  requestType: z.enum([
    "architect",
    "fire-code",
    "electrical",
    "blueprint-generator",
    "blueprint-review",
    "device-placement",
    "material-estimate",
    "cad-edit",
    "project-memory",
    "knowledge-search",
  ]),
  prompt: z.string().min(1),
  projectId: z.string().optional(),
  blueprint: z.any().optional(),
  projectContext: z.any().optional(),
});

gatewayRouter.post("/", async (req, res) => {
  try {
    const parsed = gatewaySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid Sentinel Nexus AI request.",
        details: parsed.error.flatten(),
      });
    }

    const result = await orchestrateAiRequest(parsed.data);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Sentinel Nexus AI failed.",
    });
  }
});

module.exports = { gatewayRouter };
