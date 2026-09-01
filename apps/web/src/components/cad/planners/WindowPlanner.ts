import type { CadWall, CadWindow } from "@/components/cad/geometry/BuildingGeometry";

function wallLength(wall: CadWall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

function wallAngle(wall: CadWall) {
  return Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);
}

function pointAlong(wall: CadWall, t: number) {
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    z: wall.start.z + (wall.end.z - wall.start.z) * t,
  };
}

export function planWindows({ walls, stories }: { walls: CadWall[]; stories: number }): CadWindow[] {
  const exterior = walls.filter((wall) => wall.label === "Exterior Wall" && wallLength(wall) >= 8);

  return exterior.flatMap((wall) => {
    const length = wallLength(wall);
    const count = Math.max(1, Math.floor(length / 10));
    const rotation = wallAngle(wall);

    return Array.from({ length: stories }).flatMap((_, floorIndex) =>
      Array.from({ length: count }).map((__, index) => {
        const point = pointAlong(wall, (index + 1) / (count + 1));

        return {
          id: `window-${wall.id}-f${floorIndex + 1}-${index + 1}`,
          label: `Window F${floorIndex + 1}`,
          x: point.x,
          z: point.z,
          width: 3,
          height: 1.1,
          sillHeight: 1.2,
          rotation,
          floor: floorIndex + 1,
          storyHeight: wall.height,
          layer: "ARCHITECTURE",
        };
      }),
    );
  });
}
