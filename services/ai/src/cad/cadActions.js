function createCadActions(prompt, blueprint) {
  return {
    type: "cad-edit",
    prompt,
    actions: [
      {
        action: "NOTE",
        message: "CAD edit action scaffold ready.",
      },
    ],
    blueprint,
  };
}

module.exports = { createCadActions };
