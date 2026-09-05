"use client";

import { OrbitControls } from "@react-three/drei";
import InteriorWallRenderer from "./InteriorWallRenderer";
import RoomRenderer from "./RoomRenderer";
import DoorRenderer from "./DoorRenderer";
import WindowRenderer from "./WindowRenderer";
import StairRenderer from "./StairRenderer";
import DeviceRenderer from "./DeviceRenderer";
import DimensionRenderer, { generateRoomDimensions } from "./DimensionRenderer";
import ExteriorWallRenderer, { getExteriorFootprintFromRooms } from "./ExteriorWallRenderer";

type CadSceneMovementProps = {
  moveDoor: (id: string, point: { x: number; z: number }) => void;
  moveWindow: (id: string, point: { x: number; z: number }) => void;
  moveStair: (id: string, point: { x: number; z: number }) => void;
};


export default function CadScene({
  rooms,
  walls,
  doors,
  windows,
  stairs,
  devices,
  visibleLayers,
  selectedId,
  selectedBlockIndex,
  draggingId,
  wireStartId,
  controlsRef,
  setSelectedId,
  setSelectedBlockIndex,
  setSelectedDimension,
  setDraggingId,
  handleDeviceSelect,
  Floor,
  handleCanvasClick,
  moveRoom,
  moveDoor,
  moveWindow,
  moveStair,
  moveDevice,
  measureStart,
  measureEnd,
  MeasurementLine,
  wires,
  WireModel,
  showRoof,
  placementActive,
}: any & CadSceneMovementProps) {
  const dimensions = selectedId
    ? generateRoomDimensions(rooms.filter((room: any) => room.id === selectedId))
    : [];
  const rawExteriorFootprint = getExteriorFootprintFromRooms(rooms);
  const exteriorFootprint =
    rawExteriorFootprint &&
    Number.isFinite(rawExteriorFootprint.minX) &&
    Number.isFinite(rawExteriorFootprint.maxX) &&
    Number.isFinite(rawExteriorFootprint.minZ) &&
    Number.isFinite(rawExteriorFootprint.maxZ) &&
    Number.isFinite(rawExteriorFootprint.height)
      ? { ...rawExteriorFootprint, showRoof, hideWalls: true }
      : null;
  const gridSize = Math.max(
    40,
    Math.ceil(
      Math.max(
        ...rooms.map((room: any) => Math.abs(room.x || 0) + (room.width || 0)),
        ...rooms.map((room: any) => Math.abs(room.z || 0) + (room.depth || 0)),
        40,
      ) * 2,
    ),
  );

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 8, 6]} intensity={1.2} />
      <gridHelper args={[gridSize, gridSize, "#facc15", "#334155"]} />

      <Floor
        onClick={handleCanvasClick}
        onMove={(point: any) => {
          if (!draggingId) return;
          moveRoom(draggingId, point);
          moveDoor(draggingId, point);
          moveWindow(draggingId, point);
          moveStair(draggingId, point);
          moveDevice(draggingId, point);
        }}
        onStop={() => setDraggingId("")}
      />

      {visibleLayers.ARCHITECTURE && exteriorFootprint && (
        <ExteriorWallRenderer footprint={exteriorFootprint} selected={false} />
      )}

      {walls.filter((wall: any) => visibleLayers[wall.layer]).map((wall: any) => (
        <InteriorWallRenderer key={wall.id} wall={wall} selected={selectedId === wall.id} onSelect={() => setSelectedId(wall.id)} />
      ))}

      {rooms.filter((room: any) => visibleLayers[room.layer]).map((room: any) => (
        <RoomRenderer
          key={room.id}
          room={room}
          selected={selectedId === room.id}
          selectedBlockIndex={selectedId === room.id ? selectedBlockIndex : null}
          placementActive={placementActive}
          onSelect={() => {
            setSelectedId(room.id);
            setSelectedBlockIndex(null);
            setSelectedDimension(null);
          }}
          onBlockSelect={(index) => {
            setSelectedId(room.id);
            setSelectedBlockIndex(index);
          }}
          onDragStart={() => setDraggingId(room.id)}
        />
      ))}

      {dimensions.map((dimension) => (
        <DimensionRenderer key={dimension.id} dimension={dimension} />
      ))}

      {doors.filter((door: any) => door.layer ? visibleLayers[door.layer] : true).map((door: any) => (
        <DoorRenderer key={door.id} door={door} selected={selectedId === door.id} onSelect={() => setSelectedId(door.id)} />
      ))}

      {windows.filter((windowItem: any) => windowItem.layer ? visibleLayers[windowItem.layer] : true).map((windowItem: any) => (
        <WindowRenderer key={windowItem.id} windowItem={windowItem} selected={selectedId === windowItem.id} onSelect={() => setSelectedId(windowItem.id)} />
      ))}

      {stairs.map((stair: any) => (
        <StairRenderer
          key={stair.id}
          stair={{
            ...stair,
            stories: Math.max(1, ...rooms.map((room: any) => room.stories || 1)),
            storyHeight: rooms[0]?.height || 3,
          }}
          selected={selectedId === stair.id}
          onSelect={() => setSelectedId(stair.id)}
        />
      ))}

      {measureStart && measureEnd && <MeasurementLine start={measureStart} end={measureEnd} />}

      {wires.map((wire: any) => {
        const from = devices.find((device: any) => device.id === wire.fromId);
        const to = devices.find((device: any) => device.id === wire.toId);
        if (!from || !to) return null;
        return <WireModel key={wire.id} from={from} to={to} />;
      })}

      {devices.filter((device: any) => visibleLayers[device.layer]).map((device: any) => (
        <DeviceRenderer
          key={device.id}
          device={device}
          selected={selectedId === device.id || wireStartId === device.id}
          onSelect={() => handleDeviceSelect(device)}
        />
      ))}

      <OrbitControls ref={controlsRef} makeDefault enabled={!draggingId} />
    </>
  );
}
