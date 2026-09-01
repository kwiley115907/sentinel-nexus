"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export type DeviceLayer =
  | "FIRE_ALARM"
  | "CCTV"
  | "SECURITY"
  | "ACCESS"
  | "ARCHITECTURE";

export interface Device3D {
  id: string;
  label: string;
  x: number;
  z: number;
  y?: number;
  floor?: number;
  storyHeight?: number;
  layer: DeviceLayer;
  type?: string;
  wallMounted?: boolean;
  rotation?: number;
}

function getDeviceColor(device: Device3D) {
  const label = `${device.label} ${device.type ?? ""}`.toUpperCase();

  if (label.includes("HS") || label.includes("HORN") || label.includes("STROBE")) return "#ef4444";
  if (label.includes("SD") || label.includes("SMOKE")) return "#fde047";
  if (label.includes("PULL") || label.includes("PS")) return "#dc2626";
  if (label.includes("FACP") || label.includes("PANEL")) return "#38bdf8";
  if (label.includes("CAM")) return "#a78bfa";

  return "#22c55e";
}

export default function DeviceRenderer({
  device,
  selected = false,
  onSelect,
}: {
  device: Device3D;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const storyHeight = device.storyHeight ?? 10;
  const floor = Math.max(1, device.floor ?? 1);
  const y = device.y ?? (device.wallMounted ? 4.5 : storyHeight * floor - 0.35);
  const color = getDeviceColor(device);

  return (
    <group
      position={[device.x, y, device.z]}
      rotation={[0, device.rotation ?? 0, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh>
        <sphereGeometry args={[selected ? 0.34 : 0.25, 24, 24]} />
        <meshStandardMaterial color={selected ? "#22c55e" : color} />
      </mesh>

      <mesh position={[0, -y / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, y, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.75, 0.75, 0.75)]} />
        <lineBasicMaterial color={selected ? "#22c55e" : color} />
      </lineSegments>

      <Text position={[0, 0.45, 0]} fontSize={0.24} color={color}>
        {device.label}
      </Text>
    </group>
  );
}

export function generateFireAlarmDevicesForRooms(
  rooms: Array<{
    id: string;
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    stories: number;
  }>,
): Device3D[] {
  return rooms.flatMap((room) => {
    const devices: Device3D[] = [];
    const stories = Math.max(1, room.stories || 1);

    for (let floor = 1; floor <= stories; floor++) {
      devices.push({
        id: `sd-${room.id}-f${floor}`,
        label: "SD",
        type: "SMOKE",
        x: room.x,
        z: room.z,
        floor,
        storyHeight: room.height,
        layer: "FIRE_ALARM",
      });

      devices.push({
        id: `hs-${room.id}-f${floor}`,
        label: "HS",
        type: "HORN_STROBE",
        x: room.x + room.width / 2 - 0.45,
        z: room.z,
        y: (floor - 1) * room.height + 4.5,
        floor,
        storyHeight: room.height,
        wallMounted: true,
        layer: "FIRE_ALARM",
      });
    }

    return devices;
  });
}
