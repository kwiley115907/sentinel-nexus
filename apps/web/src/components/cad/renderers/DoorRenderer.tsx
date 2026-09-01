"use client";

import * as THREE from "three";
import { Text } from "@react-three/drei";

export interface Door3D {
  id: string;
  x: number;
  z: number;

  width?: number;
  height?: number;
  thickness?: number;

  rotation?: number;

  label?: string;

  exterior?: boolean;

  layer?: string;

  floor?: number;
  storyHeight?: number;
}

export default function DoorRenderer({
  door,
  selected=false,
  onSelect,
}:{
  door:Door3D;
  selected?:boolean;
  onSelect?:()=>void;
}){

  const width=door.width ?? 3;
  const height=door.height ?? 7;
  const thickness=door.thickness ?? 0.18;

  const angle=door.rotation ?? 0;

  const floor=door.floor ?? 1;
  const storyHeight=door.storyHeight ?? 2.8;
  const floorOffset=(floor-1)*storyHeight;

  return(

    <group
      position={[door.x,floorOffset,door.z]}
      rotation={[0,angle,0]}
      onClick={(e)=>{
        e.stopPropagation();
        onSelect?.();
      }}
    >

      {/* frame */}

      <mesh position={[0,height/2,0]}>
        <boxGeometry args={[width+0.15,height,thickness+0.06]}/>
        <meshStandardMaterial
          color="#44403c"
          roughness={0.7}
        />
      </mesh>

      {/* opening */}

      <mesh position={[0,height/2,0]}>
        <boxGeometry args={[width,height,thickness]}/>
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0}
        />
      </mesh>

      {/* door slab */}

      <mesh
        position={[
          -width/4,
          height/2,
          0
        ]}
      >
        <boxGeometry
          args={[
            width/2,
            height,
            thickness
          ]}
        />
        <meshStandardMaterial
          color={selected ? "#22c55e" : "#8b5a2b"}
        />
      </mesh>

      {/* swing arc */}

      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(g:any)=>{
            const pts=[];

            for(let a=0;a<=Math.PI/2;a+=Math.PI/48){

              pts.push(
                new THREE.Vector3(
                  Math.cos(a)*(width/2),
                  0.02,
                  Math.sin(a)*(width/2)
                )
              );

            }

            g.setFromPoints(pts);

          }}
        />

        <lineBasicMaterial
          color="#fde047"
        />

      </line>

      {/* hinge */}

      <mesh
        position={[
          -width/2,
          0.04,
          0
        ]}
      >
        <sphereGeometry
          args={[
            0.08,
            12,
            12
          ]}
        />

        <meshStandardMaterial
          color="#111827"
        />

      </mesh>

      {/* label */}

      <Text
        position={[
          0,
          height+0.4,
          0
        ]}
        fontSize={0.22}
        color="#fde047"
      >

        {door.label ?? (door.exterior ? "Exterior Door" : "Door")}

      </Text>

      {/* highlight */}

      {selected && (

        <lineSegments>

          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                width+0.2,
                height,
                thickness+0.2
              )
            ]}
          />

          <lineBasicMaterial
            color="#22c55e"
          />

        </lineSegments>

      )}

    </group>

  );

}
