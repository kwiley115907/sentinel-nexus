"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export type PlantType = "TREE" | "SHRUB" | "FLOWER";

export type Plant3D = {
  id: string;
  x: number;
  z: number;
  type?: PlantType;
  scale?: number;
  label?: string;
  floor?: number;
  storyHeight?: number;
};

const PLANT_LABEL: Record<PlantType, string> = {
  TREE: "Tree",
  SHRUB: "Shrub",
  FLOWER: "Flower Bed",
};

function Tree({ scale, selected }: { scale: number; selected: boolean }) {
  const trunkHeight = 1.1 * scale;
  const canopyRadius = 0.85 * scale;

  return (
    <group>
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.09 * scale, 0.13 * scale, trunkHeight, 8]} />
        <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
      </mesh>

      <mesh position={[0, trunkHeight + canopyRadius * 0.75, 0]}>
        <coneGeometry args={[canopyRadius, canopyRadius * 1.9, 9]} />
        <meshStandardMaterial color={selected ? "#22c55e" : "#2f7d3c"} roughness={0.85} />
      </mesh>

      <mesh position={[0, trunkHeight + canopyRadius * 1.5, 0]}>
        <coneGeometry args={[canopyRadius * 0.7, canopyRadius * 1.4, 9]} />
        <meshStandardMaterial color={selected ? "#22c55e" : "#3a9149"} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Shrub({ scale, selected }: { scale: number; selected: boolean }) {
  const r = 0.4 * scale;
  return (
    <group>
      {[
        [0, 0, 0],
        [r * 0.7, 0, r * 0.3],
        [-r * 0.6, 0, -r * 0.4],
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], r * 0.7, pos[2]]}>
          <sphereGeometry args={[r * 0.75, 10, 10]} />
          <meshStandardMaterial color={selected ? "#22c55e" : "#3a8a4a"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function FlowerBed({ scale, selected }: { scale: number; selected: boolean }) {
  const colors = ["#f472b6", "#facc15", "#f87171", "#ffffff"];
  const radius = 0.35 * scale;

  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[radius, radius, 0.06, 16]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
      </mesh>

      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * radius * 0.6;
        const z = Math.sin(angle) * radius * 0.6;
        return (
          <mesh key={i} position={[x, 0.1 * scale, z]}>
            <sphereGeometry args={[0.08 * scale, 8, 8]} />
            <meshStandardMaterial color={selected ? "#22c55e" : colors[i % colors.length]} roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function LandscapingRenderer({
  plant,
  selected = false,
  onSelect,
}: {
  plant: Plant3D;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const type = plant.type ?? "TREE";
  const scale = plant.scale ?? 1;

  const floor = plant.floor ?? 1;
  const storyHeight = plant.storyHeight ?? 3;
  const floorOffset = (floor - 1) * storyHeight;

  return (
    <group
      position={[plant.x, floorOffset, plant.z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      {type === "TREE" && <Tree scale={scale} selected={selected} />}
      {type === "SHRUB" && <Shrub scale={scale} selected={selected} />}
      {type === "FLOWER" && <FlowerBed scale={scale} selected={selected} />}

      {selected && (
        <lineSegments position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.CircleGeometry(0.55 * scale, 20)]} />
          <lineBasicMaterial color="#22c55e" />
        </lineSegments>
      )}

      <Text
        position={[0, (type === "TREE" ? 3 : type === "SHRUB" ? 0.75 : 0.45) * scale, 0]}
        fontSize={0.2}
        color="#a3e635"
      >
        {plant.label ?? PLANT_LABEL[type]}
      </Text>
    </group>
  );
}
