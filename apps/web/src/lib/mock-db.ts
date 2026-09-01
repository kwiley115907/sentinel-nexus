export const mockDb = {
  blueprints: [
    {
      id: "bp-1",
      title: "First Floor Fire Alarm Plan",
      building: "Main Building",
      floor: "1",
      drawingUrl: "#",
      revision: "A",
      devices: 12,
      wireRuns: 5,
    },
  ],
  devices: [
    {
      id: "dev-1",
      tag: "SD-101",
      type: "SMOKE_DETECTOR",
      zone: "1",
      circuit: "SLC-1",
      xPosition: 25,
      yPosition: 40,
    },
    {
      id: "dev-2",
      tag: "CAM-201",
      type: "CAMERA",
      zone: "Security",
      circuit: "PoE-1",
      xPosition: 70,
      yPosition: 35,
    },
  ],
  wireRuns: [
    {
      id: "wr-1",
      label: "SLC-1A",
      cableType: "18/2 FPLP",
      startPoint: "FSentinel Nexus",
      endPoint: "SD-101",
      estimatedFeet: 180,
    },
  ],
};
