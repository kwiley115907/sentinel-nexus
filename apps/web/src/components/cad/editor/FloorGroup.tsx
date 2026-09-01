"use client";

import type { ReactNode } from "react";
import { floorElevation } from "./EditableCadTypes";

export default function FloorGroup({
  floor,
  storyHeight,
  visible,
  children,
}: {
  floor: number;
  storyHeight: number;
  visible: boolean;
  children: ReactNode;
}) {
  if (!visible) return null;

  return (
    <group position={[0, floorElevation(floor, storyHeight), 0]}>
      {children}
    </group>
  );
}
