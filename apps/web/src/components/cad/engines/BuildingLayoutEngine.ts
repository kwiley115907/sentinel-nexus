import type { CadRoom } from "@/components/cad/geometry/BuildingGeometry";

function isHallway(label: string) {
  const text = label.toLowerCase();
  return text.includes("hall") || text.includes("corridor");
}

function isLobby(label: string) {
  return label.toLowerCase().includes("lobby");
}

export function solveConnectedBuildingLayout(rooms: CadRoom[]): CadRoom[] {
  if (rooms.length <= 1) return rooms;

  const storyCount = Math.max(...rooms.map((room) => room.stories || 1));
  const baseRooms = rooms.filter((room) => room.floor === 1 || !room.floor);

  const lobby = baseRooms.find((room) => isLobby(room.label));
  const corridor =
    baseRooms.find((room) => isHallway(room.label)) ?? {
      ...baseRooms[0],
      id: "main-corridor",
      label: "Main Corridor",
      width: Math.max(18, baseRooms.length * 3),
      depth: 3,
    };

  const nonCorridorRooms = baseRooms.filter(
    (room) => room.id !== corridor.id && !isHallway(room.label),
  );

  const topRow = nonCorridorRooms.filter((_, index) => index % 2 === 0);
  const bottomRow = nonCorridorRooms.filter((_, index) => index % 2 === 1);

  const corridorWidth = Math.max(
    corridor.width,
    Math.max(topRow.length, bottomRow.length) * 7,
    18,
  );

  const solvedBase: CadRoom[] = [
    {
      ...corridor,
      id: "main-corridor",
      label: "Main Corridor",
      x: 0,
      z: 0,
      width: corridorWidth,
      depth: 3,
      floor: 1,
      stories: storyCount,
    },
  ];

  if (lobby) {
    solvedBase.push({
      ...lobby,
      id: "lobby",
      label: lobby.label,
      x: 0,
      z: 5.5,
      width: Math.max(lobby.width, 10),
      depth: Math.max(lobby.depth, 5),
      floor: 1,
      stories: storyCount,
    });
  }

  const placeRow = (row: CadRoom[], z: number, prefix: string) => {
    const totalWidth = row.reduce((sum, room) => sum + room.width, 0);
    let cursor = -totalWidth / 2;

    row.forEach((room, index) => {
      const x = cursor + room.width / 2;
      cursor += room.width;

      solvedBase.push({
        ...room,
        id: `${prefix}-${room.id}`,
        x,
        z,
        floor: 1,
        stories: storyCount,
      });
    });
  };

  placeRow(topRow, -4.5, "north");
  placeRow(bottomRow, 4.5, "south");

  return Array.from({ length: storyCount }).flatMap((_, floorIndex) =>
    solvedBase.map((room) => ({
      ...room,
      id: `${room.id}-f${floorIndex + 1}`,
      label: `${room.label} - F${floorIndex + 1}`,
      floor: floorIndex + 1,
      stories: storyCount,
    })),
  );
}
