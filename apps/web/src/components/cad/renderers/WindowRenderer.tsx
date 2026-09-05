"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export interface Window3D {
  id: string;
  x: number;
  z: number;

  width?: number;
  height?: number;
  sillHeight?: number;
  thickness?: number;

  rotation?: number;
  floor?: number;
  storyHeight?: number;
  label?: string;
  layer?: string;
}

export default function WindowRenderer({
  windowItem,
  selected = false,
  onSelect,
}: {
  windowItem: Window3D;
  selected?: boolean;
  onSelect?: () => void;
}) {
  // A manually-placed window previously defaulted to a sill at 3 units
  // plus 3 units of height - spanning from y=3 to y=6 against rooms
  // that are ~2.8-3 units of ceiling height, floating entirely above
  // the roofline. AI-generated buildings use a sill of 1.2 and height
  // of 1.1 (fits comfortably under a 3-unit ceiling); matched here.
  const width = windowItem.width ?? 3;
  const height = windowItem.height ?? 1.1;
  const sillHeight = windowItem.sillHeight ?? 1.2;
  const thickness = windowItem.thickness ?? 0.12;
  const storyHeight = windowItem.storyHeight ?? 3;
  const floor = Math.max(1, windowItem.floor ?? 1);
  const y = sillHeight + height / 2 + (floor - 1) * storyHeight;
  const rotation = windowItem.rotation ?? 0;

  return (
    <group
      position={[windowItem.x, y, windowItem.z]}
      rotation={[0, rotation, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh>
        <boxGeometry args={[width + 0.08, height + 0.08, thickness]} />
        <meshStandardMaterial color={selected ? "#22c55e" : "#f4f4f4"} roughness={0.55} />
      </mesh>

      <mesh position={[0, 0, thickness / 2 + 0.015]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial
          color="#1c2a38"
          roughness={0.15}
          metalness={0.3}
          emissive="#0c2138"
          emissiveIntensity={0.5}
          transparent
          opacity={0.82}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width + 0.08, height + 0.08, thickness)]} />
        <lineBasicMaterial color={selected ? "#22c55e" : "#3f3f46"} />
      </lineSegments>

      <mesh position={[0, 0, thickness / 2 + 0.03]}>
        <boxGeometry args={[0.05, height, 0.02]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.5} />
      </mesh>

      <mesh position={[0, 0, thickness / 2 + 0.03]}>
        <boxGeometry args={[width, 0.05, 0.02]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.5} />
      </mesh>

      <Text position={[0, height / 2 + 0.35, 0]} fontSize={0.22} color="#38bdf8">
        {windowItem.label ?? `Window F${floor}`}
      </Text>
    </group>
  );
}

export function generateStackedWindowsForRooms(
  rooms: Array<{
    id: string;
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    stories: number;
  }>,
): Window3D[] {
  return rooms.flatMap((room) => {
    const storyHeight = room.height || 3;
    const stories = Math.max(1, room.stories || 1);
    const windows: Window3D[] = [];

    for (let floor = 1; floor <= stories; floor++) {
      windows.push(
        {
          id: `window-front-left-${room.id}-f${floor}`,
          x: room.x - room.width / 4,
          z: room.z - room.depth / 2 - 0.08,
          width: Math.min(4, room.width / 3),
          floor,
          storyHeight,
          rotation: 0,
          label: `Window F${floor}`,
        },
        {
          id: `window-front-right-${room.id}-f${floor}`,
          x: room.x + room.width / 4,
          z: room.z - room.depth / 2 - 0.08,
          width: Math.min(4, room.width / 3),
          floor,
          storyHeight,
          rotation: 0,
          label: `Window F${floor}`,
        },
        {
          id: `window-back-left-${room.id}-f${floor}`,
          x: room.x - room.width / 4,
          z: room.z + room.depth / 2 + 0.08,
          width: Math.min(4, room.width / 3),
          floor,
          storyHeight,
          rotation: 0,
          label: `Window F${floor}`,
        },
        {
          id: `window-back-right-${room.id}-f${floor}`,
          x: room.x + room.width / 4,
          z: room.z + room.depth / 2 + 0.08,
          width: Math.min(4, room.width / 3),
          floor,
          storyHeight,
          rotation: 0,
          label: `Window F${floor}`,
        },
      );
    }

    return windows;
  });
}
