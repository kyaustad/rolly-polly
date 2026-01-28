"use client";

import { useRef, useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
// @ts-expect-error three addons have no bundled types
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
// @ts-expect-error three addons have no bundled types
import * as THREE from "three";
import { D6 } from "./D6";

const DICE_SPACING = 1.2;
const DICE_OBJ_URL = "/Dice.obj";

const diceMaterial = new THREE.MeshStandardMaterial({
  color: "#e8e0d5",
  roughness: 0.4,
  metalness: 0.05,
});

function useDiceModelClones(numDice: number): THREE.Group[] {
  const obj = useLoader(OBJLoader, DICE_OBJ_URL);
  return useMemo(() => {
    const clones: THREE.Group[] = [];
    for (let i = 0; i < numDice; i++) {
      const clone = obj.clone();
      clone.scale.setScalar(0.45);
      clone.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = diceMaterial;
        }
      });
      clones.push(clone);
    }
    return clones;
  }, [obj, numDice]);
}

function DiceTableWithModel({
  numDice,
  onRollComplete,
  disabled,
  triggerRoll = 0,
}: {
  numDice: number;
  onRollComplete: (results: number[]) => void;
  disabled?: boolean;
  triggerRoll?: number;
}) {
  const [rolling, setRolling] = useState(false);
  const [results, setResults] = useState<number[]>(() =>
    Array(numDice)
      .fill(0)
      .map(() => 1)
  );
  const settled = useRef(0);
  const resultsRef = useRef<number[]>([]);
  const prevTrigger = useRef(0);
  const modelClones = useDiceModelClones(numDice);

  useEffect(() => {
    if (triggerRoll <= 0 || rolling || disabled) return;
    if (triggerRoll === prevTrigger.current) return;
    prevTrigger.current = triggerRoll;
    const next = Array(numDice)
      .fill(0)
      .map(() => Math.floor(Math.random() * 6) + 1);
    resultsRef.current = next;
    setResults(next);
    settled.current = 0;
    setRolling(true);
  }, [triggerRoll, numDice, rolling, disabled]);

  const handleSettled = useCallback(() => {
    settled.current += 1;
    if (settled.current >= numDice) {
      setRolling(false);
      onRollComplete([...resultsRef.current]);
    }
  }, [numDice, onRollComplete]);

  const positions = useMemo(
    () =>
      Array.from({ length: numDice }, (_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return [
          (col - 1.5) * DICE_SPACING,
          0.5,
          row * -DICE_SPACING,
        ] as [number, number, number];
      }),
    [numDice]
  );

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 10, 4]} intensity={1.2} castShadow />
      <Environment preset="night" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#1a1510" roughness={0.9} metalness={0.1} />
      </mesh>
      {positions.map((pos, i) => (
        <D6
          key={i}
          position={pos}
          result={results[i] ?? 1}
          rolling={rolling}
          onSettled={handleSettled}
          model={modelClones[i]}
        />
      ))}
    </group>
  );
}

type DiceSceneProps = {
  numDice: number;
  onRollComplete: (results: number[]) => void;
  disabled?: boolean;
  triggerRoll?: number;
};

function DiceTableFallback() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#1a1510" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#2a2520" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function DiceScene(props: DiceSceneProps) {
  return (
    <div
      className="relative w-full min-h-[400px] rounded-xl overflow-hidden bg-zinc-900"
      style={{ aspectRatio: "4/3" }}
    >
      <Canvas
        shadows
        gl={{ antialias: true }}
        className="block! w-full h-full"
        camera={{ position: [0, 8, 2], fov: 45, near: 0.1, far: 100 }}
      >
        <Suspense fallback={<DiceTableFallback />}>
          <DiceTableWithModel {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
