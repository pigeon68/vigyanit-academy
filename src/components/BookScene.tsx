"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function FloatingBooks() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  const books = [
    { pos: [0, 0, 0] as [number, number, number], scale: 1.2, rotation: [0.2, 0.3, 0.1] as [number, number, number] },
    { pos: [-2, 1, 1] as [number, number, number], scale: 0.8, rotation: [0.5, -0.4, 0.2] as [number, number, number] },
    { pos: [2, -0.5, -1] as [number, number, number], scale: 0.9, rotation: [-0.3, 0.6, -0.15] as [number, number, number] },
    { pos: [0, 2, -2] as [number, number, number], scale: 0.7, rotation: [0.4, -0.2, 0.3] as [number, number, number] },
    { pos: [-1.5, -1, -1.5] as [number, number, number], scale: 0.85, rotation: [-0.2, 0.5, -0.25] as [number, number, number] },
  ];

  return (
    <group ref={groupRef}>
      {books.map((book, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={0.3} floatIntensity={0.5}>
          <mesh position={book.pos} rotation={book.rotation} scale={book.scale}>
            <boxGeometry args={[1.5, 2, 0.3]} />
            <meshStandardMaterial
              color="#c9a962"
              metalness={0.3}
              roughness={0.4}
              envMapIntensity={1}
            />
          </mesh>
          <mesh position={[book.pos[0] + 0.76, book.pos[1], book.pos[2]]} rotation={book.rotation} scale={book.scale}>
            <boxGeometry args={[0.02, 2, 0.3]} />
            <meshStandardMaterial
              color="#8a7542"
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        </Float>
      ))}

      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 3.5;
        return (
          <Float key={`particle-${i}`} speed={0.8 + i * 0.1} rotationIntensity={0.1} floatIntensity={0.3}>
            <mesh
              position={[
                Math.cos(angle) * radius,
                Math.sin(angle * 3) * 0.8,
                Math.sin(angle) * radius,
              ]}
              scale={0.06}
            >
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color="#c9a962"
                metalness={1}
                roughness={0}
                emissive="#c9a962"
                emissiveIntensity={0.3}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={0.6} color="#c9a962" />
      <FloatingBooks />
    </>
  );
}

export function BookScene() {
  return (
    <div className="absolute top-0 right-0 w-1/2 h-full z-0 opacity-40">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
