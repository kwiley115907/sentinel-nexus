import type { CadDoor, CadRoom, CadWall } from "@/components/cad/geometry/BuildingGeometry";

export function planDoors({ rooms }: { rooms: CadRoom[]; walls: CadWall[] }): CadDoor[] {
  const firstFloorRooms = rooms.filter((room) => room.floor === 1);
  const doors: CadDoor[] = [];

  for (const [index, room] of firstFloorRooms.entries()) {
    const isCorridor = room.label.toLowerCase().includes("corridor");
    if (isCorridor) continue;

    const doorZ = room.z < 0 ? room.z + room.depth / 2 : room.z - room.depth / 2;

    doors.push({
      id: `door-${room.id}`,
      label: index === 0 ? "Main Door" : "Door",
      x: room.x,
      z: doorZ,
      width: index === 0 ? 4 : 3,
      height: 2.4,
      rotation: 0,
      floor: room.floor,
      layer: "ARCHITECTURE",
    });
  }

  return doors;
}
