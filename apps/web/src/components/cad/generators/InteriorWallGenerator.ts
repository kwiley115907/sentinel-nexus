import type { CadRoom, CadWall } from "@/components/cad/geometry/BuildingGeometry";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function key(start: { x: number; z: number }, end: { x: number; z: number }) {
  const a = `${round(start.x)},${round(start.z)}`;
  const b = `${round(end.x)},${round(end.z)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function roomWalls(room: CadRoom): CadWall[] {
  const left = room.x - room.width / 2;
  const right = room.x + room.width / 2;
  const front = room.z - room.depth / 2;
  const back = room.z + room.depth / 2;

  return [
    { id: `interior-${room.id}-north`, start: { x: left, z: front }, end: { x: right, z: front }, height: room.height, thickness: 0.16, label: "Interior Wall", layer: "ARCHITECTURE" },
    { id: `interior-${room.id}-south`, start: { x: left, z: back }, end: { x: right, z: back }, height: room.height, thickness: 0.16, label: "Interior Wall", layer: "ARCHITECTURE" },
    { id: `interior-${room.id}-west`, start: { x: left, z: front }, end: { x: left, z: back }, height: room.height, thickness: 0.16, label: "Interior Wall", layer: "ARCHITECTURE" },
    { id: `interior-${room.id}-east`, start: { x: right, z: front }, end: { x: right, z: back }, height: room.height, thickness: 0.16, label: "Interior Wall", layer: "ARCHITECTURE" },
  ];
}

export function generateInteriorWallsFromRooms(rooms: CadRoom[]): CadWall[] {
  const grouped = new Map<string, CadWall[]>();

  for (const room of rooms) {
    for (const wall of roomWalls(room)) {
      const wallKey = key(wall.start, wall.end);
      grouped.set(wallKey, [...(grouped.get(wallKey) ?? []), wall]);
    }
  }

  return [...grouped.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([wallKey, matches]) => ({
      ...matches[0],
      id: `interior-${wallKey.replace(/[^a-zA-Z0-9]/g, "-")}`,
      label: "Interior Wall",
      thickness: 0.16,
    }));
}
