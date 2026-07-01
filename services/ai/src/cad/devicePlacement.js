function suggestDevicePlacement(blueprint) {
  const rooms = blueprint?.rooms || [];

  return {
    type: "device-placement",
    devices: rooms.flatMap((room, index) => [
      {
        id: `sd-${index + 1}`,
        type: "SD",
        label: "Smoke Detector",
        roomId: room.id,
        x: room.x + room.width / 2,
        y: room.y + room.height / 2,
      },
      {
        id: `hs-${index + 1}`,
        type: "HS",
        label: "Horn/Strobe",
        roomId: room.id,
        x: room.x + 2,
        y: room.y + 2,
      },
    ]),
    notes: ["Device placement is a design assist only. Verify with adopted codes and AHJ."],
  };
}

module.exports = { suggestDevicePlacement };
