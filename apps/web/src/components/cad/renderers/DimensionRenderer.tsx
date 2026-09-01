"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export interface DimensionPoint {
  x: number;
  y?: number;
  z: number;
}

export interface Dimension3D {
  id: string;
  start: DimensionPoint;
  end: DimensionPoint;
  label?: string;
  color?: string;
  offset?: number;
}

function formatFeetInches(value: number) {
  const totalInches = Math.round(Math.abs(value) * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

function ArrowHead({
  position,
  angle,
  color,
}: {
  position: [number, number, number];
  angle: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, -angle]}>
      <coneGeometry args={[0.16, 0.42, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function makeLine(start: THREE.Vector3, end: THREE.Vector3, color: string) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color });
  return new THREE.Line(geometry, material);
}

export default function DimensionRenderer({
  dimension,
}: {
  dimension: Dimension3D;
}) {
  const color = dimension.color ?? "#22c55e";
  const offset = dimension.offset ?? 0.6;

  const start = new THREE.Vector3(
    dimension.start.x,
    dimension.start.y ?? 0.12,
    dimension.start.z,
  );

  const end = new THREE.Vector3(
    dimension.end.x,
    dimension.end.y ?? 0.12,
    dimension.end.z,
  );

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const normal = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
  const offsetVector = normal.multiplyScalar(offset);

  const dimStart = start.clone().add(offsetVector);
  const dimEnd = end.clone().add(offsetVector);
  const mid = dimStart.clone().add(dimEnd).multiplyScalar(0.5);

  const witnessA = makeLine(start, dimStart, color);
  const witnessB = makeLine(end, dimEnd, color);
  const dimLine = makeLine(dimStart, dimEnd, color);

  return (
    <group>
      <primitive object={witnessA} />
      <primitive object={witnessB} />
      <primitive object={dimLine} />

      <ArrowHead position={[dimStart.x, dimStart.y, dimStart.z]} angle={angle + Math.PI} color={color} />
      <ArrowHead position={[dimEnd.x, dimEnd.y, dimEnd.z]} angle={angle} color={color} />

      <Text position={[mid.x, mid.y + 0.28, mid.z]} fontSize={0.3} color={color}>
        {dimension.label ? `${dimension.label}: ` : ""}
        {formatFeetInches(length)}
      </Text>
    </group>
  );
}

export function generateRoomDimensions(
  rooms: Array<{
    id: string;
    label: string;
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    stories: number;
  }>,
): Dimension3D[] {
  return rooms.flatMap((room) => {
    const left = room.x - room.width / 2;
    const right = room.x + room.width / 2;
    const front = room.z - room.depth / 2;
    const back = room.z + room.depth / 2;
    const totalHeight = room.height * Math.max(1, room.stories);

    return [
      {
        id: `dimension-width-${room.id}`,
        start: { x: left, z: front },
        end: { x: right, z: front },
        label: `${room.label} Width`,
        color: "#22c55e",
        offset: -0.8,
      },
      {
        id: `dimension-depth-${room.id}`,
        start: { x: right, z: front },
        end: { x: right, z: back },
        label: `${room.label} Length`,
        color: "#22c55e",
        offset: 0.8,
      },
      {
        id: `dimension-height-${room.id}`,
        start: { x: left, y: 0.15, z: back },
        end: { x: left, y: totalHeight, z: back },
        label: `${room.label} Height`,
        color: "#fde047",
        offset: 0,
      },
    ];
  });
}

export function generateHallwayDimensions(
  hallways: Array<{
    id: string;
    label: string;
    x: number;
    z: number;
    width: number;
    depth: number;
  }>,
): Dimension3D[] {
  return hallways.flatMap((hallway) => {
    const left = hallway.x - hallway.width / 2;
    const right = hallway.x + hallway.width / 2;
    const front = hallway.z - hallway.depth / 2;
    const back = hallway.z + hallway.depth / 2;

    return [
      {
        id: `hallway-width-${hallway.id}`,
        start: { x: left, z: hallway.z },
        end: { x: right, z: hallway.z },
        label: `${hallway.label} Width`,
        color: "#38bdf8",
        offset: 0.5,
      },
      {
        id: `hallway-length-${hallway.id}`,
        start: { x: hallway.x, z: front },
        end: { x: hallway.x, z: back },
        label: `${hallway.label} Length`,
        color: "#38bdf8",
        offset: -0.5,
      },
    ];
  });
}
