function estimateMaterials(blueprint) {
  const rooms = blueprint?.rooms || [];
  const roomCount = rooms.length || 1;

  return {
    type: "material-estimate",
    materials: {
      SD: roomCount,
      HS: Math.ceil(roomCount / 2),
      PS: 2,
      FACP: 1,
      FPLP_CABLE_FT: roomCount * 150,
    },
    notes: ["Estimate only. Field verification required."],
  };
}

module.exports = { estimateMaterials };
