function reviewBlueprint(blueprint) {
  return {
    type: "blueprint-review",
    issues: [],
    suggestions: [
      "Add room labels.",
      "Add exits.",
      "Add device legend.",
      "Verify final fire alarm layout with local AHJ.",
    ],
    blueprint,
  };
}

module.exports = { reviewBlueprint };
