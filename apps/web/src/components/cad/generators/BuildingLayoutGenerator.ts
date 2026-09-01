export type GeneratedRoom = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  stories: number;
  floor: number;
  shape: "RECTANGLE";
  layer: "ARCHITECTURE";
};

function room(
  id: string,
  label: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  stories: number,
): GeneratedRoom {
  return {
    id,
    label,
    x,
    z,
    width,
    depth,
    height: 3,
    stories,
    floor: 1,
    shape: "RECTANGLE",
    layer: "ARCHITECTURE",
  };
}

export function generateProceduralBuildingLayout({
  type,
  stories,
}: {
  type: string;
  stories: number;
}): GeneratedRoom[] {
  const buildingType = type.toLowerCase();
  const floors = Math.max(1, stories);

  if (buildingType.includes("hospital")) {
    return [
      room("main-lobby", "Main Lobby", -8, -7, 8, 5, floors),
      room("corridor-main", "Main Corridor", 2, -7, 16, 3, floors),
      room("triage", "Triage", -8, -1, 7, 5, floors),
      room("exam-1", "Exam Room 1", 0, -1, 6, 5, floors),
      room("exam-2", "Exam Room 2", 7, -1, 6, 5, floors),
      room("nurse-station", "Nurse Station", -8, 5, 7, 5, floors),
      room("med-storage", "Medical Storage", 0, 5, 6, 5, floors),
      room("mechanical", "Mechanical", 7, 5, 6, 5, floors),
    ];
  }

  if (buildingType.includes("school")) {
    return [
      room("main-lobby", "Main Lobby", -8, -8, 8, 5, floors),
      room("corridor-main", "Main Corridor", 2, -8, 18, 3, floors),
      room("classroom-1", "Classroom 1", -8, -1, 7, 6, floors),
      room("classroom-2", "Classroom 2", 0, -1, 7, 6, floors),
      room("classroom-3", "Classroom 3", 8, -1, 7, 6, floors),
      room("cafeteria", "Cafeteria", -6, 7, 10, 6, floors),
      room("gym", "Gym", 7, 7, 10, 7, floors),
    ];
  }

  if (buildingType.includes("office")) {
    return [
      room("reception", "Reception", -8, -6, 7, 5, floors),
      room("corridor-main", "Main Corridor", 1, -6, 14, 3, floors),
      room("open-office", "Open Office", -6, 1, 10, 7, floors),
      room("conference", "Conference", 6, 1, 8, 6, floors),
      room("break-room", "Break Room", -6, 8, 7, 5, floors),
      room("it-room", "IT Room", 5, 8, 5, 5, floors),
    ];
  }

  return [
    room("entry", "Entry", -6, -6, 6, 4, floors),
    room("corridor-main", "Main Corridor", 2, -6, 12, 3, floors),
    room("room-1", "Room 1", -6, 0, 6, 5, floors),
    room("room-2", "Room 2", 1, 0, 6, 5, floors),
    room("room-3", "Room 3", 8, 0, 6, 5, floors),
  ];
}

export function detectBuildingType(prompt: string) {
  const text = prompt.toLowerCase();

  if (text.includes("hospital") || text.includes("clinic")) return "hospital";
  if (text.includes("school") || text.includes("classroom")) return "school";
  if (text.includes("office")) return "office";
  if (text.includes("hotel")) return "hotel";
  if (text.includes("warehouse")) return "warehouse";

  return "custom";
}

export function detectStories(prompt: string) {
  const text = prompt.toLowerCase();

  if (text.includes("two story") || text.includes("2 story") || text.includes("2-story")) return 2;
  if (text.includes("three story") || text.includes("3 story") || text.includes("3-story")) return 3;
  if (text.includes("four story") || text.includes("4 story") || text.includes("4-story")) return 4;

  const match = text.match(/(\d+)\s*(story|stories|floor|floors)/);
  return match ? Math.max(1, Number(match[1])) : 1;
}
