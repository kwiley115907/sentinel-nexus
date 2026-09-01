"use client";

import { useEffect, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import type { Group } from "three";
import type {
  EditableCadObject,
  TransformMode,
} from "./EditableCadTypes";
import { floorElevation } from "./EditableCadTypes";

type PositionUpdate = {
  x: number;
  y: number;
  z: number;
  rotation: number;
};

function objectPosition(
  object: EditableCadObject,
  storyHeight: number,
): [number, number, number] {
  const floorY = floorElevation(object.floor || 1, storyHeight);

  if (object.objectType === "WALL") {
    return [
      (object.start.x + object.end.x) / 2,
      floorY,
      (object.start.z + object.end.z) / 2,
    ];
  }

  return [
    object.x,
    floorY,
    object.z,
  ];
}

export default function EditableObjectControls({
  object,
  storyHeight,
  mode,
  onChange,
}: {
  object: EditableCadObject | null;
  storyHeight: number;
  mode: TransformMode;
  onChange: (update: PositionUpdate) => void;
}) {
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (!object || !groupRef.current) return;

    const [x, y, z] = objectPosition(object, storyHeight);
    groupRef.current.position.set(x, y, z);

    if ("rotation" in object) {
      groupRef.current.rotation.y = object.rotation || 0;
    } else {
      groupRef.current.rotation.y = 0;
    }
  }, [object, storyHeight]);

  if (!object) return null;

  return (
    <TransformControls
      mode={mode}
      showY={object.objectType === "DEVICE"}
      onObjectChange={() => {
        const group = groupRef.current;
        if (!group) return;

        onChange({
          x: group.position.x,
          y: group.position.y,
          z: group.position.z,
          rotation: group.rotation.y,
        });
      }}
    >
      <group ref={groupRef}>
        <mesh visible={false}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </TransformControls>
  );
}
