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

  /** Mirrors which side the door hinges on and which way it swings. */
  flip?: boolean;
  /** Renders as a pair of leaves splitting the opening instead of one. */
  double?: boolean;
}

export default function DoorRenderer({
  door,
  selected=false,
  onSelect,
  onDragStart,
  placementActive,
}:{
  door:Door3D;
  selected?:boolean;
  onSelect?:()=>void;
  onDragStart?:()=>void;
  placementActive?:boolean;
}){

  // A manually-placed door previously defaulted to 3 units wide by 7
  // units tall against rooms that are ~2.8-3 units of ceiling height -
  // over twice the room's own height. AI-generated buildings already use
  // sane door sizes (width 3-4, height 2.4) that fit comfortably under
  // their rooms' height, so these defaults now match that.
  const width=door.width ?? 3;
  const height=door.height ?? 2.4;
  const thickness=door.thickness ?? 0.15;
  const double=door.double ?? false;
  const sign=door.flip ? -1 : 1;

  const angle=door.rotation ?? 0;

  const floor=door.floor ?? 1;
  const storyHeight=door.storyHeight ?? 2.8;
  const floorOffset=(floor-1)*storyHeight;

  return(

    <group
      position={[door.x,floorOffset,door.z]}
      rotation={[0,angle,0]}
      onClick={(e)=>{
        if (placementActive) return;
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerDown={(e)=>{
        if (placementActive) return;
        e.stopPropagation();
        onSelect?.();
        onDragStart?.();
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
          depthWrite={false}
        />
      </mesh>

      {double ? (
        <>
          {/* double door: two leaves, each hinged at its outer edge */}
          {[-1, 1].map((leafSign) => (
            <group key={leafSign}>
              <mesh position={[leafSign * width / 4, height / 2, 0]}>
                <boxGeometry args={[width / 2, height, thickness]} />
                <meshStandardMaterial color={selected ? "#22c55e" : "#8b5a2b"} />
              </mesh>

              <line>
                <bufferGeometry
                  attach="geometry"
                  onUpdate={(g: any) => {
                    const pts = [];
                    for (let a = 0; a <= Math.PI / 2; a += Math.PI / 48) {
                      pts.push(
                        new THREE.Vector3(
                          leafSign * Math.cos(a) * (width / 4),
                          0.02,
                          Math.sin(a) * (width / 4),
                        ),
                      );
                    }
                    g.setFromPoints(pts);
                  }}
                />
                <lineBasicMaterial color="#fde047" />
              </line>

              <mesh position={[leafSign * width / 2, 0.04, 0]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#111827" />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <>
          {/* door slab */}

          <mesh
            position={[
              sign * -width/4,
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
                      sign * Math.cos(a)*(width/2),
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
              sign * -width/2,
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
        </>
      )}

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
