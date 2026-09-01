import type { CadRoom, CadWall, CadWindow } from "@/components/cad/geometry/BuildingGeometry";

function wallLength(wall: CadWall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

function wallAngle(wall: CadWall) {
  return Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);
}

function pointAlongWall(wall: CadWall, t: number) {
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    z: wall.start.z + (wall.end.z - wall.start.z) * t,
  };
}

export function placeWindowsOnExteriorWalls({
  walls,
  stories,
}: {
  walls: CadWall[];
  stories: number;
}): CadWindow[] {
  const exteriorWalls = walls.filter(
    (wall) => wall.label === "Exterior Wall" && wallLength(wall) >= 4,
  );

  return exteriorWalls.flatMap((wall) => {
    const length = wallLength(wall);
    const count = Math.max(1, Math.floor(length / 8));
    const angle = wallAngle(wall);

    const windows: CadWindow[] = [];

    for (let floor = 1; floor <= Math.max(1, stories); floor++) {
      for (let index = 0; index < count; index++) {
        const t = (index + 1) / (count + 1);
        const point = pointAlongWall(wall, t);

        windows.push({
          id: `window-${wall.id}-f${floor}-${index + 1}`,
          label: `Window F${floor}`,
          x: point.x,
          z: point.z,
          width: Math.min(4, Math.max(2.5, length / 6)),
          height: 1.1,
          sillHeight: 1.2,
          rotation: angle,
          floor,
          storyHeight: wall.height,
          layer: "ARCHITECTURE",
        });
      }
    }

    return windows;
  });
}
