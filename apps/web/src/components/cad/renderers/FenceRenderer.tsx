"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export type FenceType = "CHAIN_LINK" | "PICKET" | "WOOD" | "WROUGHT_IRON";

export type Fence3D = {
  id: string;
  x: number;
  z: number;
  length?: number;
  height?: number;
  rotation?: number;
  type?: FenceType;
  isGate?: boolean;
  label?: string;
  floor?: number;
  storyHeight?: number;
};

const FENCE_LABEL: Record<FenceType, string> = {
  CHAIN_LINK: "Chain Link",
  PICKET: "Picket",
  WOOD: "Wood Privacy",
  WROUGHT_IRON: "Wrought Iron",
};

function Posts({ length, height, radius, color }: { length: number; height: number; radius: number; color: string }) {
  return (
    <>
      {[-length / 2, length / 2].map((x) => (
        <mesh key={x} position={[x, height / 2, 0]}>
          <cylinderGeometry args={[radius, radius, height, 10]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
    </>
  );
}

function ChainLinkPanel({ length, height }: { length: number; height: number }) {
  const rows = Math.max(2, Math.round(height * 2));
  const cols = Math.max(2, Math.round(length * 2));

  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.9} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>

      <lineSegments position={[0, height / 2, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(length, height)]} />
        <lineBasicMaterial color="#6b7280" />
      </lineSegments>

      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(g: any) => {
            const pts: THREE.Vector3[] = [];
            for (let i = 0; i <= cols; i++) {
              const x = -length / 2 + (length * i) / cols;
              pts.push(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, height, 0));
            }
            for (let j = 0; j <= rows; j++) {
              const y = (height * j) / rows;
              pts.push(new THREE.Vector3(-length / 2, y, 0), new THREE.Vector3(length / 2, y, 0));
            }
            g.setFromPoints(pts);
          }}
        />
        <lineBasicMaterial color="#94a3b8" transparent opacity={0.5} />
      </line>
    </group>
  );
}

function PicketPanel({ length, height }: { length: number; height: number }) {
  const count = Math.max(3, Math.round(length * 2.5));
  const slatWidth = length / count / 1.8;

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const x = -length / 2 + (length * (i + 0.5)) / count;
        return (
          <mesh key={i} position={[x, height / 2, 0]}>
            <boxGeometry args={[slatWidth, height, 0.04]} />
            <meshStandardMaterial color="#f5f5f0" roughness={0.6} />
          </mesh>
        );
      })}

      {[height * 0.3, height * 0.85].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[length, 0.08, 0.05]} />
          <meshStandardMaterial color="#e5e5df" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function WoodPanel({ length, height }: { length: number; height: number }) {
  return (
    <mesh position={[0, height / 2, 0]}>
      <boxGeometry args={[length, height, 0.08]} />
      <meshStandardMaterial color="#8b5e34" roughness={0.85} />
    </mesh>
  );
}

function WroughtIronPanel({ length, height }: { length: number; height: number }) {
  const count = Math.max(4, Math.round(length * 3));

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const x = -length / 2 + (length * (i + 0.5)) / count;
        return (
          <mesh key={i} position={[x, height / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, height, 8]} />
            <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.6} />
          </mesh>
        );
      })}

      {[0.06, height - 0.06].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[length, 0.05, 0.05]} />
          <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function FenceRenderer({
  fence,
  selected = false,
  onSelect,
}: {
  fence: Fence3D;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const length = fence.length ?? 4;
  const height = fence.height ?? (fence.isGate ? 1.5 : 1.8);
  const type = fence.type ?? "CHAIN_LINK";
  const rotation = fence.rotation ?? 0;

  const floor = fence.floor ?? 1;
  const storyHeight = fence.storyHeight ?? 3;
  const floorOffset = (floor - 1) * storyHeight;

  const Panel = type === "PICKET" ? PicketPanel : type === "WOOD" ? WoodPanel : type === "WROUGHT_IRON" ? WroughtIronPanel : ChainLinkPanel;
  const postColor = type === "WROUGHT_IRON" ? "#1f2937" : type === "WOOD" ? "#6b4a2c" : "#71717a";

  return (
    <group
      position={[fence.x, floorOffset, fence.z]}
      rotation={[0, rotation, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <Posts length={length} height={height} radius={fence.isGate ? 0.04 : 0.03} color={postColor} />

      {fence.isGate ? (
        // gate: the panel swings from the left post like a door, with a
        // swing-arc CAD symbol so it reads as an opening, not a solid run
        <group position={[-length / 2, 0, 0]}>
          <group position={[length / 2, 0, 0]}>
            <Panel length={length} height={height} />
          </group>
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(g: any) => {
                const pts = [];
                for (let a = 0; a <= Math.PI / 2; a += Math.PI / 24) {
                  pts.push(new THREE.Vector3(Math.cos(a) * length, 0.03, Math.sin(a) * length));
                }
                g.setFromPoints(pts);
              }}
            />
            <lineBasicMaterial color="#fde047" />
          </line>
        </group>
      ) : (
        <Panel length={length} height={height} />
      )}

      {selected && (
        <lineSegments position={[0, height / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(length + 0.15, height + 0.1, 0.1)]} />
          <lineBasicMaterial color="#22c55e" />
        </lineSegments>
      )}

      <Text position={[0, height + 0.35, 0]} fontSize={0.22} color="#fde047">
        {fence.label ?? (fence.isGate ? `Gate (${FENCE_LABEL[type]})` : FENCE_LABEL[type])}
      </Text>
    </group>
  );
}
