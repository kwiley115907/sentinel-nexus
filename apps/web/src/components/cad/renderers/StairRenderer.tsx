"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export interface Stair3D {
  id: string;
  x: number;
  z: number;
  width?: number;
  depth?: number;
  floor?: number;
  storyHeight?: number;
  stories?: number;
  rotation?: number;
  label?: string;
  layer?: string;
}

export default function StairRenderer({
  stair,
  selected = false,
  onSelect,
}: {
  stair: Stair3D;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const width = stair.width ?? 5;
  const depth = stair.depth ?? 8;
  const storyHeight = stair.storyHeight ?? 10;
  const floor = Math.max(1, stair.floor ?? 1);
  const stories = Math.max(1, stair.stories ?? 1);
  const rotation = stair.rotation ?? 0;

  if (stories <= 1) return null;

  const stairCount = 10;
  const treadDepth = depth / stairCount;
  const riserHeight = storyHeight / stairCount;
  const baseY = (floor - 1) * storyHeight;

  return (
    <group
      position={[stair.x, baseY, stair.z]}
      rotation={[0, rotation, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[width + 0.6, 0.1, depth + 0.6]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>

      {Array.from({ length: stairCount }).map((_, index) => (
        <mesh
          key={index}
          position={[
            0,
            index * riserHeight + riserHeight / 2,
            -depth / 2 + index * treadDepth + treadDepth / 2,
          ]}
        >
          <boxGeometry args={[width, riserHeight, treadDepth]} />
          <meshStandardMaterial color={selected ? "#22c55e" : "#9ca3af"} roughness={0.85} />
        </mesh>
      ))}

      <mesh position={[-width / 2 - 0.2, storyHeight / 2, 0]}>
        <boxGeometry args={[0.06, storyHeight, depth]} />
        <meshStandardMaterial color="#71717a" roughness={0.4} metalness={0.6} />
      </mesh>

      <mesh position={[width / 2 + 0.2, storyHeight / 2, 0]}>
        <boxGeometry args={[0.06, storyHeight, depth]} />
        <meshStandardMaterial color="#71717a" roughness={0.4} metalness={0.6} />
      </mesh>

      <lineSegments position={[0, storyHeight / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width + 0.6, storyHeight, depth + 0.6)]} />
        <lineBasicMaterial color={selected ? "#22c55e" : "#374151"} transparent opacity={selected ? 1 : 0.4} />
      </lineSegments>

      <Text position={[0, storyHeight + 0.45, 0]} fontSize={0.28} color="#fde047">
        {stair.label ?? `Stairs F${floor} to F${floor + 1}`}
      </Text>
    </group>
  );
}

export function generateStairsForBuilding({
  stories,
  x,
  z,
  width = 5,
  depth = 8,
  storyHeight = 10,
}: {
  stories: number;
  x: number;
  z: number;
  width?: number;
  depth?: number;
  storyHeight?: number;
}): Stair3D[] {
  if (stories <= 1) return [];

  return Array.from({ length: stories - 1 }).map((_, index) => ({
    id: `stair-f${index + 1}-to-f${index + 2}`,
    x,
    z,
    width,
    depth,
    floor: index + 1,
    stories,
    storyHeight,
    label: `Stairs F${index + 1} to F${index + 2}`,
    layer: "ARCHITECTURE",
  }));
}
