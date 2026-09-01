"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

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
};

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
  const thickness = wall.thickness ?? 0.12;

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
          color={selected ? "#86efac" : "#ece7db"}
          roughness={0.9}
          transparent
          opacity={selected ? 0.85 : 0.68}
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
      },
      {
        id: `interior-${room.id}-south`,
        start: { x: x1, z: z2 },
        end: { x: x2, z: z2 },
        height: room.height,
        label: `${room.id} south wall`,
        floor,
        storyHeight: room.height,
      },
      {
        id: `interior-${room.id}-west`,
        start: { x: x1, z: z1 },
        end: { x: x1, z: z2 },
        height: room.height,
        label: `${room.id} west wall`,
        floor,
        storyHeight: room.height,
      },
      {
        id: `interior-${room.id}-east`,
        start: { x: x2, z: z1 },
        end: { x: x2, z: z2 },
        height: room.height,
        label: `${room.id} east wall`,
        floor,
        storyHeight: room.height,
      },
    ];
  });
}
