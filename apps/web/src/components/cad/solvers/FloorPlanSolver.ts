import type { CadRoom } from "@/components/cad/geometry/BuildingGeometry";

function cleanId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isLobby(room: CadRoom) {
  return room.label.toLowerCase().includes("lobby");
}

function isCorridor(room: CadRoom) {
  const text = room.label.toLowerCase();
  return text.includes("corridor") || text.includes("hall");
}

export function solveFloorPlan(rawRooms: CadRoom[]): CadRoom[] {
  if (!rawRooms.length) return [];

  const stories = Math.max(1, ...rawRooms.map((room) => room.stories || 1));
  const firstFloor = rawRooms.filter((room) => (room.floor || 1) === 1);

  const lobby = firstFloor.find(isLobby);
  const existingCorridor = firstFloor.find(isCorridor);

  const rooms = firstFloor.filter(
    (room) => room.id !== lobby?.id && room.id !== existingCorridor?.id,
  );

  const north = rooms.filter((_, index) => index % 2 === 0);
  const south = rooms.filter((_, index) => index % 2 === 1);

  const northWidth = north.reduce((sum, room) => sum + room.width, 0);
  const southWidth = south.reduce((sum, room) => sum + room.width, 0);
  const corridorWidth = Math.max(30, northWidth, southWidth, lobby?.width || 0);

  const base: CadRoom[] = [
    {
      ...(existingCorridor || firstFloor[0]),
      id: "main-corridor",
      label: "Main Corridor",
      x: 0,
      z: 0,
      width: corridorWidth,
      depth: 4,
      height: 3,
      floor: 1,
      stories,
      shape: "RECTANGLE",
      layer: "ARCHITECTURE",
    },
  ];

  if (lobby) {
    base.push({
      ...lobby,
      id: "lobby",
      label: "Lobby",
      x: -corridorWidth / 2 + 6,
      z: 5,
      width: 12,
      depth: 6,
      height: 3,
      floor: 1,
      stories,
    });
  }

  function placeRow(row: CadRoom[], side: "north" | "south") {
    const totalWidth = row.reduce((sum, room) => sum + room.width, 0);
    let cursor = -totalWidth / 2;

    for (const room of row) {
      const width = Math.max(6, room.width);
      const depth = Math.max(5, room.depth);
      const x = cursor + width / 2;
      const z = side === "north" ? -(2 + depth / 2) : 2 + depth / 2;

      base.push({
        ...room,
        id: `${side}-${cleanId(room.id)}`,
        label: room.label,
        x,
        z,
        width,
        depth,
        height: 3,
        floor: 1,
        stories,
        shape: "RECTANGLE",
        layer: "ARCHITECTURE",
      });

      cursor += width;
    }
  }

  placeRow(north, "north");
  placeRow(south, "south");

  return Array.from({ length: stories }).flatMap((_, floorIndex) =>
    base.map((room) => ({
      ...room,
      id: `${room.id}-f${floorIndex + 1}`,
      label: `${room.label} - F${floorIndex + 1}`,
      floor: floorIndex + 1,
      stories,
    })),
  );
}
