"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export type WallSide = "NORTH" | "SOUTH" | "EAST" | "WEST";
export type ExteriorMaterial = "SIDING" | "STUCCO" | "BRICK";
export type InteriorFinish = "SHEETROCK" | "TILE";

export type InteriorWall3D = {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  height?: number;
  thickness?: number;
  label?: string;
  layer?: string;
  floor?: number;
  storyHeight?: number;
  side?: WallSide;
  /** Set when this wall is on the building's exterior - takes priority over `finish`. */
  exteriorMaterial?: ExteriorMaterial;
  /** Set when this is an interior partition wall. */
  finish?: InteriorFinish;
};

const EXTERIOR_MATERIAL_STYLE: Record<ExteriorMaterial, { color: string; roughness: number; metalness: number }> = {
  SIDING: { color: "#9db3c2", roughness: 0.55, metalness: 0.05 },
  STUCCO: { color: "#d9c8a5", roughness: 0.95, metalness: 0 },
  BRICK: { color: "#9c4a3c", roughness: 0.85, metalness: 0.02 },
};

const INTERIOR_FINISH_STYLE: Record<InteriorFinish, { color: string; roughness: number; metalness: number }> = {
  SHEETROCK: { color: "#eef0ea", roughness: 0.9, metalness: 0 },
  TILE: { color: "#dbe9ea", roughness: 0.2, metalness: 0.15 },
};

const DEFAULT_WALL_STYLE = { color: "#cdba97", roughness: 0.85, metalness: 0 };

function wallStyle(wall: InteriorWall3D) {
  if (wall.exteriorMaterial) return EXTERIOR_MATERIAL_STYLE[wall.exteriorMaterial];
  if (wall.finish) return INTERIOR_FINISH_STYLE[wall.finish];
  return DEFAULT_WALL_STYLE;
}

function formatFeetInches(value: number) {
  const totalInches = Math.round(Math.abs(value) * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

export default function InteriorWallRenderer({
  wall,
  selected = false,
  showLabel = true,
  onSelect,
}: {
  wall: InteriorWall3D;
  selected?: boolean;
  showLabel?: boolean;
  onSelect?: () => void;
}) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const height = wall.height ?? 3;
  const thickness = wall.thickness ?? (wall.exteriorMaterial ? 0.3 : 0.12);
  const style = wallStyle(wall);

  const floor = wall.floor ?? 1;
  const storyHeight = wall.storyHeight ?? height;
  const floorOffset = (floor - 1) * storyHeight;

  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.z + wall.end.z) / 2;
  const midY = floorOffset + height / 2;

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh position={[midX, midY, midZ]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial
          color={selected ? "#86efac" : style.color}
          roughness={style.roughness}
          metalness={style.metalness}
          transparent
          opacity={selected ? 0.85 : 0.97}
        />
      </mesh>

      <lineSegments position={[midX, midY, midZ]} rotation={[0, -angle, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(length, height, thickness)]} />
        <lineBasicMaterial color={selected ? "#22c55e" : "#8a8375"} transparent opacity={selected ? 1 : 0.4} />
      </lineSegments>

      {showLabel && (
        <Text position={[midX, floorOffset + height + 0.35, midZ]} fontSize={0.25} color="#fde047">
          {wall.label || `Wall ${formatFeetInches(length)}`}
        </Text>
      )}
    </group>
  );
}

export function generateInteriorWallsFromRooms(
  rooms: Array<{
    id: string;
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    floor?: number;
  }>,
): InteriorWall3D[] {
  return rooms.flatMap((room) => {
    const x1 = room.x - room.width / 2;
    const x2 = room.x + room.width / 2;
    const z1 = room.z - room.depth / 2;
    const z2 = room.z + room.depth / 2;
    const floor = room.floor ?? 1;

    return [
      {
        id: `interior-${room.id}-north`,
        start: { x: x1, z: z1 },
        end: { x: x2, z: z1 },
        height: room.height,
        label: `${room.id} north wall`,
        floor,
        storyHeight: room.height,
        side: "NORTH" as WallSide,
      },
      {
        id: `interior-${room.id}-south`,
        start: { x: x1, z: z2 },
        end: { x: x2, z: z2 },
        height: room.height,
        label: `${room.id} south wall`,
        floor,
        storyHeight: room.height,
        side: "SOUTH" as WallSide,
      },
      {
        id: `interior-${room.id}-west`,
        start: { x: x1, z: z1 },
        end: { x: x1, z: z2 },
        height: room.height,
        label: `${room.id} west wall`,
        floor,
        storyHeight: room.height,
        side: "WEST" as WallSide,
      },
      {
        id: `interior-${room.id}-east`,
        start: { x: x2, z: z1 },
        end: { x: x2, z: z2 },
        height: room.height,
        label: `${room.id} east wall`,
        floor,
        storyHeight: room.height,
        side: "EAST" as WallSide,
      },
    ];
  });
}

/**
 * Two rooms placed edge to edge each generate their own wall along the
 * shared boundary, so that boundary would otherwise render as two
 * overlapping wall boxes. Collapses any walls that sit on the exact
 * same line and span the same range down to one.
 */
export function dedupeSharedWalls(walls: InteriorWall3D[]): InteriorWall3D[] {
  const EPSILON = 0.01;
  const round = (value: number) => Math.round(value / EPSILON);

  const seen = new Map<string, InteriorWall3D>();

  for (const wall of walls) {
    const vertical = Math.abs(wall.start.x - wall.end.x) < EPSILON;
    const floor = wall.floor ?? 1;

    const key = vertical
      ? `V:${round(wall.start.x)}:${round(Math.min(wall.start.z, wall.end.z))}:${round(Math.max(wall.start.z, wall.end.z))}:${floor}`
      : `H:${round(wall.start.z)}:${round(Math.min(wall.start.x, wall.end.x))}:${round(Math.max(wall.start.x, wall.end.x))}:${floor}`;

    if (!seen.has(key)) {
      seen.set(key, wall);
    }
  }

  return Array.from(seen.values());
}

/**
 * Tags each auto-generated perimeter wall as exterior (with the chosen
 * siding/stucco/brick for that side of the building) or interior (with
 * the chosen sheetrock/tile finish).
 *
 * Previously this only flagged a wall exterior when it touched the
 * overall rectangular bounding box of every room combined - correct for
 * a single rectangular building, but wrong for any L-shaped, corridor
 * + wings, or otherwise non-rectangular layout (exactly what the AI
 * building generator produces): most of the genuinely outward-facing
 * walls on a shape like that never touch the bounding rectangle's four
 * straight edges, so they fell through to the "interior" branch and got
 * painted with the near-white sheetrock finish - which is what read as
 * "plain white sheet, no stucco/brick applied" even though the exterior
 * material picker was working correctly the whole time.
 *
 * Instead, probe a small distance out from each wall's own outward side
 * (using its `side` - NORTH/SOUTH/EAST/WEST - which already records
 * which way it faces relative to the room it was generated from) and
 * check whether that point falls inside any room at all. If nothing is
 * there, the wall genuinely faces open air and is exterior, regardless
 * of where it sits relative to the building's overall bounding box.
 */
export function classifyWalls(
  walls: InteriorWall3D[],
  rooms: Array<{ x: number; z: number; width: number; depth: number }>,
  exteriorMaterials: Record<WallSide, ExteriorMaterial>,
  interiorFinish: InteriorFinish,
): InteriorWall3D[] {
  const MARGIN = 0.05;
  const PROBE = 0.4;

  function isInsideAnyRoom(x: number, z: number) {
    return rooms.some(
      (room) =>
        x > room.x - room.width / 2 + MARGIN &&
        x < room.x + room.width / 2 - MARGIN &&
        z > room.z - room.depth / 2 + MARGIN &&
        z < room.z + room.depth / 2 - MARGIN,
    );
  }

  return walls.map((wall) => {
    if (!wall.side) {
      return { ...wall, finish: wall.finish ?? interiorFinish };
    }

    const midX = (wall.start.x + wall.end.x) / 2;
    const midZ = (wall.start.z + wall.end.z) / 2;

    const [testX, testZ] =
      wall.side === "NORTH"
        ? [midX, midZ - PROBE]
        : wall.side === "SOUTH"
          ? [midX, midZ + PROBE]
          : wall.side === "WEST"
            ? [midX - PROBE, midZ]
            : [midX + PROBE, midZ];

    const facesOpenAir = !isInsideAnyRoom(testX, testZ);

    if (facesOpenAir) {
      return { ...wall, exteriorMaterial: exteriorMaterials[wall.side], finish: undefined };
    }

    return { ...wall, exteriorMaterial: undefined, finish: wall.finish ?? interiorFinish };
  });
}
