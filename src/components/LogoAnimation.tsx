"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function StarShape({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.01;
      meshRef.current.scale.setScalar(0.08 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.03);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#c9a962" emissive="#c9a962" emissiveIntensity={4} />
    </mesh>
  );
}

function LogoSculpture() {
  const groupRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  // Add a dummy ref to maintain hook count from previous version and prevent HMR error
  const dummyRef = useRef(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15;
    }
    if (cubeRef.current) {
      cubeRef.current.rotation.x = t * 0.2;
      cubeRef.current.rotation.y = t * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={0.75}>
      {/* Central Gold Cube */}
      <mesh ref={cubeRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#d4af37" 
          metalness={1} 
          roughness={0.2} 
          emissive="#c9a962"
          emissiveIntensity={0.2}
        />
        <mesh scale={1.02}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#c9a962" wireframe transparent opacity={0.4} />
        </mesh>
      </mesh>

      {/* Tilted Rings */}
      <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
        <mesh>
          <torusGeometry args={[1.8, 0.03, 16, 100]} />
          <meshStandardMaterial color="#c9a962" metalness={1} roughness={0.1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.015, 12, 80]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} transparent opacity={0.5} />
        </mesh>
      </group>

      <group rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[2.0, 0.02, 16, 100]} />
          <meshStandardMaterial color="#c9a962" metalness={1} roughness={0.1} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Sparkles/Stars */}
      <StarShape position={[1.5, 1.2, 0.5]} />
      <StarShape position={[-1.2, -1.5, -0.5]} />
      <StarShape position={[0.8, -1.8, 1]} />
      <StarShape position={[-1.8, 0.5, -1]} />
    </group>
  );
}

export function LogoAnimation() {
  return (
    <div className="w-full h-full relative overflow-visible flex items-center justify-center">
      <Suspense fallback={null}>
        <Canvas 
          flat
          camera={{ position: [0, 0, 8], fov: 35 }} 
          gl={{ alpha: true, antialias: true, stencil: false, depth: true }}
          style={{ width: '160%', height: '160%', position: 'absolute' }}
        >
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={3} color="#c9a962" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
          <LogoSculpture />
        </Canvas>
      </Suspense>
    </div>
  );
}
