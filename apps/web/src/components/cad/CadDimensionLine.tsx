"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

function formatFeet(value: number) {
  const totalInches = Math.round(Math.abs(value) * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

function ArrowHead({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.18, 0.45, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export default function CadDimensionLine({
  start,
  end,
  label,
  color = "#22c55e",
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  color?: string;
}) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
  const distance = startVec.distanceTo(endVec);
  const geometry = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);

  return (
    <group>
      <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }))} />

      <ArrowHead position={start} rotation={[0, 0, Math.PI / 2]} color={color} />
      <ArrowHead position={end} rotation={[0, 0, -Math.PI / 2]} color={color} />

      <Text position={[mid.x, mid.y + 0.25, mid.z]} fontSize={0.32} color={color}>
        {label}: {formatFeet(distance)}
      </Text>
    </group>
  );
}
