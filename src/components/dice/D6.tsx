"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
// @ts-expect-error three has no bundled types
import * as THREE from "three";

/** Face layout for Dice.obj: which local axis shows which value. (1 up = +Y; 2↔3 on ±Z.) */
const LOCAL_NORMALS: [THREE.Vector3, number][] = [
  [new THREE.Vector3(0, 1, 0), 1],
  [new THREE.Vector3(0, -1, 0), 4],
  [new THREE.Vector3(0, 0, 1), 3],
  [new THREE.Vector3(0, 0, -1), 2],
  [new THREE.Vector3(1, 0, 0), 5],
  [new THREE.Vector3(-1, 0, 0), 6],
];

const WORLD_UP = new THREE.Vector3(0, 1, 0);

function faceFromQuaternion(q: THREE.Quaternion): number {
  let best = 0;
  let bestDot = -2;
  const dir = new THREE.Vector3();
  for (let i = 0; i < 6; i++) {
    dir.copy(LOCAL_NORMALS[i][0]).applyQuaternion(q);
    const d = dir.dot(WORLD_UP);
    if (d > bestDot) {
      bestDot = d;
      best = LOCAL_NORMALS[i][1];
    }
  }
  return best;
}

/** Orient a cube so face `value` (1–6) is up. Uses same layout as faceFromQuaternion. */
function quaternionForFace(value: number): THREE.Quaternion {
  const idx = LOCAL_NORMALS.findIndex(([, v]) => v === value);
  const localUp = LOCAL_NORMALS[idx][0].clone();
  const q = new THREE.Quaternion();
  q.setFromUnitVectors(localUp, WORLD_UP);
  return q;
}

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#e8e0d5",
  roughness: 0.4,
  metalness: 0.05,
});

export type D6Props = {
  position: [number, number, number];
  result: number;
  rolling: boolean;
  onSettled?: (value: number) => void;
  /** When set, use this group (scaled OBJ clone) instead of the procedural box. */
  model?: THREE.Group;
};

export function D6({ position, result, rolling, onSettled, model }: D6Props) {
  const groupRef = useRef<THREE.Object3D>(null);
  const state = useRef({
    phase: "idle" as "idle" | "spinning" | "snapping",
    spinTime: 0,
    snapStart: null as THREE.Quaternion | null,
    snapEnd: null as THREE.Quaternion | null,
    snapT: 0,
  });

  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), []);

  useFrame((_, delta) => {
    const node = groupRef.current;
    if (!node) return;
    const s = state.current;

    if (rolling && s.phase === "idle") {
      s.phase = "spinning";
      s.spinTime = 0;
    }

    if (s.phase === "spinning") {
      s.spinTime += delta;
      node.rotation.x += delta * (4 + Math.random() * 4);
      node.rotation.y += delta * (3 + Math.random() * 4);
      node.rotation.z += delta * (2 + Math.random() * 2);
      if (s.spinTime >= 1.4) {
        s.phase = "snapping";
        s.snapStart = node.quaternion.clone();
        s.snapEnd = quaternionForFace(result);
        s.snapT = 0;
      }
    }

    if (s.phase === "snapping") {
      s.snapT = Math.min(1, s.snapT + delta * 4);
      const t = 1 - Math.pow(1 - s.snapT, 2);
      if (s.snapStart && s.snapEnd) {
        node.quaternion.slerpQuaternions(s.snapStart, s.snapEnd, t);
      }
      if (s.snapT >= 1) {
        s.phase = "idle";
        onSettled?.(result);
      }
    }
  });

  if (model) {
    return (
      <group ref={groupRef} position={position}>
        <primitive object={model} />
      </group>
    );
  }

  return (
    <mesh
      ref={groupRef as React.RefObject<THREE.Mesh>}
      position={position}
      geometry={boxGeo}
      material={DEFAULT_MATERIAL}
      castShadow
      receiveShadow
    />
  );
}

export { faceFromQuaternion, quaternionForFace };
