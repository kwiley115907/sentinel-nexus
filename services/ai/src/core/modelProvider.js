async function askModel({ system, prompt, context }) {
  return {
    provider: "sentinel-nexus-local-placeholder",
    system,
    prompt,
    context,
    message:
      "Model backend not connected yet. This placeholder proves the Sentinel Nexus AI system architecture works.",
  };
}

module.exports = { askModel };
