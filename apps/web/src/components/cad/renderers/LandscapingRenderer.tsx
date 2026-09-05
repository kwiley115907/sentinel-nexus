"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export type PlantType = "TREE" | "SHRUB" | "FLOWER" | "GRASS";

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
  GRASS: "Grass",
};

// Deterministic pseudo-random in [0,1) seeded from a plant's own position,
// so a shrub's cluster of leaves looks the same on every render instead of
// re-randomizing (and flickering) each time React re-renders it.
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

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

function Shrub({ scale, selected, seed }: { scale: number; selected: boolean; seed: number }) {
  const r = 0.4 * scale;
  const greens = ["#3a8a4a", "#357a42", "#4a9a56", "#2f6e3a"];
  const clumps = 7;

  return (
    <group>
      {Array.from({ length: clumps }).map((_, i) => {
        const rand1 = seededRandom(seed + i * 3.1);
        const rand2 = seededRandom(seed + i * 3.1 + 1.7);
        const rand3 = seededRandom(seed + i * 3.1 + 2.9);
        const angle = rand1 * Math.PI * 2;
        const dist = rand2 * r * 0.65;
        const size = r * (0.45 + rand3 * 0.4);

        return (
          <mesh key={i} position={[Math.cos(angle) * dist, size * (0.7 + rand3 * 0.5), Math.sin(angle) * dist]}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshStandardMaterial
              color={selected ? "#22c55e" : greens[i % greens.length]}
              roughness={0.95}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function GrassPatch({ scale, selected, seed }: { scale: number; selected: boolean; seed: number }) {
  const radius = 0.6 * scale;
  const blades = 24;

  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 20]} />
        <meshStandardMaterial color={selected ? "#22c55e" : "#4d8f3a"} roughness={0.95} />
      </mesh>

      {Array.from({ length: blades }).map((_, i) => {
        const rand1 = seededRandom(seed + i * 2.3);
        const rand2 = seededRandom(seed + i * 2.3 + 1.1);
        const angle = rand1 * Math.PI * 2;
        const dist = rand2 * radius * 0.85;
        const bladeHeight = 0.12 * scale * (0.7 + rand2 * 0.6);

        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * dist, bladeHeight / 2, Math.sin(angle) * dist]}
            rotation={[0, angle, (rand1 - 0.5) * 0.5]}
          >
            <coneGeometry args={[0.02 * scale, bladeHeight, 4]} />
            <meshStandardMaterial color={selected ? "#22c55e" : "#5da542"} roughness={0.9} />
          </mesh>
        );
      })}
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
  onDragStart,
  placementActive,
}: {
  plant: Plant3D;
  selected?: boolean;
  onSelect?: () => void;
  onDragStart?: () => void;
  placementActive?: boolean;
}) {
  const type = plant.type ?? "TREE";
  const scale = plant.scale ?? 1;
  const seed = plant.x * 12.9898 + plant.z * 78.233;

  const floor = plant.floor ?? 1;
  const storyHeight = plant.storyHeight ?? 3;
  const floorOffset = (floor - 1) * storyHeight;

  return (
    <group
      position={[plant.x, floorOffset, plant.z]}
      onClick={(event) => {
        if (placementActive) return;
        event.stopPropagation();
        onSelect?.();
      }}
      onPointerDown={(event) => {
        if (placementActive) return;
        event.stopPropagation();
        onSelect?.();
        onDragStart?.();
      }}
    >
      {type === "TREE" && <Tree scale={scale} selected={selected} />}
      {type === "SHRUB" && <Shrub scale={scale} selected={selected} seed={seed} />}
      {type === "FLOWER" && <FlowerBed scale={scale} selected={selected} />}
      {type === "GRASS" && <GrassPatch scale={scale} selected={selected} seed={seed} />}

      {selected && (
        <lineSegments position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.CircleGeometry(0.55 * scale, 20)]} />
          <lineBasicMaterial color="#22c55e" />
        </lineSegments>
      )}

      <Text
        position={[0, (type === "TREE" ? 3 : type === "SHRUB" ? 0.75 : type === "GRASS" ? 0.3 : 0.45) * scale, 0]}
        fontSize={0.2}
        color="#a3e635"
      >
        {plant.label ?? PLANT_LABEL[type]}
      </Text>
    </group>
  );
}
