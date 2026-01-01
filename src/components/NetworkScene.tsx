"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { useRef, Suspense, useMemo } from "react";
import * as THREE from "three";

function NetworkNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const nodes = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1;
      const height = (Math.random() - 0.5) * 2;
      positions.push([
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      ]);
    }
    return positions;
  }, []);

  const connections = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.5) {
          points.push(...nodes[i], ...nodes[j]);
        }
      }
    }
    return new Float32Array(points);
  }, [nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
    if (linesRef.current) {
      const time = state.clock.elapsedTime;
      linesRef.current.material.opacity = 0.15 + Math.sin(time) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={connections.length / 3}
            array={connections}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#c9a962"
          transparent
          opacity={0.2}
        />
      </lineSegments>

      {nodes.map((pos, i) => (
        <Float key={i} speed={1 + i * 0.15} rotationIntensity={0.2} floatIntensity={0.4}>
          <mesh position={pos}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color="#c9a962"
              metalness={1}
              roughness={0}
              emissive="#c9a962"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={pos}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial
              color="#c9a962"
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.1}
              wireframe
            />
          </mesh>
        </Float>
      ))}

      <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.2}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.15}
            wireframe
          />
        </mesh>
      </Float>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#c9a962" />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <NetworkNodes />
    </>
  );
}

export function NetworkScene() {
  return (
    <div className="absolute inset-0 z-0 opacity-25">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
