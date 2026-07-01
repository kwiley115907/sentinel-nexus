const express = require("express");
const cors = require("cors");
const { gatewayRouter } = require("./routes/gateway");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Sentinel Nexus AI",
    status: "online",
    modules: [
      "AI Gateway",
      "AI Orchestrator",
      "Knowledge Base",
      "CAD Tool Integration",
      "Project Memory",
      "Blueprint Generator",
      "Fire Alarm Designer",
      "Material Estimator",
      "Fine-Tuning Pipeline",
    ],
  });
});

app.use("/gateway", gatewayRouter);

const port = process.env.PORT || 8787;

app.listen(port, () => {
  console.log(`Sentinel Nexus AI Gateway running on port ${port}`);
});
