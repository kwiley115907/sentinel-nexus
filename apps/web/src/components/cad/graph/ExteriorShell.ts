import type { CadRoom, CadWall } from "@/components/cad/geometry/BuildingGeometry";

function boundsForFloor(rooms: CadRoom[], floor: number) {
  const floorRooms = rooms.filter((room) => room.floor === floor);
  if (!floorRooms.length) return null;

  return {
    minX: Math.min(...floorRooms.map((room) => room.x - room.width / 2)),
    maxX: Math.max(...floorRooms.map((room) => room.x + room.width / 2)),
    minZ: Math.min(...floorRooms.map((room) => room.z - room.depth / 2)),
    maxZ: Math.max(...floorRooms.map((room) => room.z + room.depth / 2)),
    height: Math.max(...floorRooms.map((room) => room.height || 3)),
  };
}

export function buildExteriorShell(rooms: CadRoom[]): CadWall[] {
  const floors = [...new Set(rooms.map((room) => room.floor || 1))].sort((a, b) => a - b);
  const walls: CadWall[] = [];

  for (const floor of floors) {
    const bounds = boundsForFloor(rooms, floor);
    if (!bounds) continue;

    const label = `F${floor}`;
    const { minX, maxX, minZ, maxZ, height } = bounds;

    walls.push(
      { id: `shell-north-${label}`, start: { x: minX, z: minZ }, end: { x: maxX, z: minZ }, height, thickness: 0.32, label: "Exterior Wall", layer: "ARCHITECTURE" },
      { id: `shell-south-${label}`, start: { x: minX, z: maxZ }, end: { x: maxX, z: maxZ }, height, thickness: 0.32, label: "Exterior Wall", layer: "ARCHITECTURE" },
      { id: `shell-west-${label}`, start: { x: minX, z: minZ }, end: { x: minX, z: maxZ }, height, thickness: 0.32, label: "Exterior Wall", layer: "ARCHITECTURE" },
      { id: `shell-east-${label}`, start: { x: maxX, z: minZ }, end: { x: maxX, z: maxZ }, height, thickness: 0.32, label: "Exterior Wall", layer: "ARCHITECTURE" },
    );
  }

  return walls;
}

export function removeRoomExteriorWalls(walls: CadWall[]) {
  return walls.filter((wall) => wall.label !== "Exterior Wall");
}
