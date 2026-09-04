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
 * the chosen sheetrock/tile finish), based on whether it sits on the
 * outer boundary of the combined footprint of every room.
 */
export function classifyWalls(
  walls: InteriorWall3D[],
  footprint: { minX: number; maxX: number; minZ: number; maxZ: number } | null,
  exteriorMaterials: Record<WallSide, ExteriorMaterial>,
  interiorFinish: InteriorFinish,
): InteriorWall3D[] {
  const EPSILON = 0.01;

  return walls.map((wall) => {
    if (!footprint) {
      return { ...wall, finish: wall.finish ?? interiorFinish };
    }

    const onNorth = wall.side === "NORTH" && Math.abs(wall.start.z - footprint.minZ) < EPSILON;
    const onSouth = wall.side === "SOUTH" && Math.abs(wall.start.z - footprint.maxZ) < EPSILON;
    const onWest = wall.side === "WEST" && Math.abs(wall.start.x - footprint.minX) < EPSILON;
    const onEast = wall.side === "EAST" && Math.abs(wall.start.x - footprint.maxX) < EPSILON;

    const exteriorSide: WallSide | null = onNorth
      ? "NORTH"
      : onSouth
        ? "SOUTH"
        : onWest
          ? "WEST"
          : onEast
            ? "EAST"
            : null;

    if (exteriorSide) {
      return { ...wall, exteriorMaterial: exteriorMaterials[exteriorSide], finish: undefined };
    }

    return { ...wall, exteriorMaterial: undefined, finish: wall.finish ?? interiorFinish };
  });
}
