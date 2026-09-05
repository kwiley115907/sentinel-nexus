"use client";

import { useState } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

export type BuildingShape =
  | "RECTANGLE"
  | "L_SHAPE"
  | "U_SHAPE"
  | "T_SHAPE"
  | "Y_SHAPE"
  | "DOUBLE_STACK"
  | "TRIPLE_STACK"
  | "TOWER";

export type RoomLayer =
  | "ARCHITECTURE"
  | "FIRE_ALARM"
  | "CCTV"
  | "SECURITY"
  | "ACCESS";

export type Room3D = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  stories: number;
  shape: BuildingShape;
  layer: RoomLayer;
  floor?: number;
};

function formatFeetInches(value: number) {
  const totalInches = Math.round(Math.abs(value) * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

export default function RoomRenderer({
  room,
  selected,
  onSelect,
  onBlockSelect,
  onDragStart,
}: {
  room: Room3D;
  selected: boolean;
  selectedBlockIndex: number | null;
  onSelect: () => void;
  onBlockSelect: (index: number) => void;
  onDragStart: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const area = room.width * room.depth;
  const totalHeight = room.height * Math.max(1, room.stories);
  // Every floor's slab previously rendered at y=0 regardless of which
  // floor the room was on, so a 2-story building's second floor sat
  // right on top of the first - visually indistinguishable from one
  // story. Offset by story height per floor, same as the wall renderers.
  const floorOffset = ((room.floor ?? 1) - 1) * room.height;

  return (
    <group
      position={[room.x, floorOffset, room.z]}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
        onDragStart();
      }}
    >
      <mesh
        position={[0, 0.025, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onBlockSelect(0);
        }}
      >
        <boxGeometry args={[room.width, 0.05, room.depth]} />
        <meshStandardMaterial
          color={selected ? "#5b6a7d" : "#9ca3af"}
          roughness={0.92}
        />
      </mesh>

      <lineSegments position={[0, 0.07, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(room.width, 0.05, room.depth)]} />
        <lineBasicMaterial color={selected ? "#22c55e" : "#6b7280"} transparent opacity={selected ? 1 : 0.5} />
      </lineSegments>

      <Text position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.38} color="#f8fafc">
        {room.label}
      </Text>

      {(hovered || selected) && (
        <Text position={[0, 0.45, 0]} fontSize={0.26} color="#22c55e">
          {`W ${formatFeetInches(room.width)} | L ${formatFeetInches(room.depth)} | H ${formatFeetInches(totalHeight)} | ${Math.round(area)} sq ft`}
        </Text>
      )}
    </group>
  );
}
