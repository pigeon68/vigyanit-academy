"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Trail } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function Atom() {
  const groupRef = useRef<THREE.Group>(null);
  const orbit1Ref = useRef<THREE.Group>(null);
  const orbit2Ref = useRef<THREE.Group>(null);
  const orbit3Ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (orbit1Ref.current) {
      orbit1Ref.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
    if (orbit2Ref.current) {
      orbit2Ref.current.rotation.z = state.clock.elapsedTime * -0.4;
    }
    if (orbit3Ref.current) {
      orbit3Ref.current.rotation.z = state.clock.elapsedTime * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh scale={0.8}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={0.8}
            roughness={0.2}
            emissive="#c9a962"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>

      <group ref={orbit1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[3, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={1}
            roughness={0}
            transparent
            opacity={0.4}
          />
        </mesh>
        <Trail width={1} length={6} color="#c9a962" attenuation={(width) => width}>
          <mesh position={[3, 0, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color="#fafaf9"
              metalness={0.5}
              roughness={0.3}
              emissive="#c9a962"
              emissiveIntensity={0.8}
            />
          </mesh>
        </Trail>
      </group>

      <group ref={orbit2Ref} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[2.5, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={1}
            roughness={0}
            transparent
            opacity={0.3}
          />
        </mesh>
        <Trail width={1} length={6} color="#c9a962" attenuation={(width) => width}>
          <mesh position={[2.5, 0, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color="#fafaf9"
              metalness={0.5}
              roughness={0.3}
              emissive="#c9a962"
              emissiveIntensity={0.6}
            />
          </mesh>
        </Trail>
      </group>

      <group ref={orbit3Ref} rotation={[Math.PI / 6, Math.PI / 3, Math.PI / 4]}>
        <mesh>
          <torusGeometry args={[3.5, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={1}
            roughness={0}
            transparent
            opacity={0.35}
          />
        </mesh>
        <Trail width={1} length={6} color="#c9a962" attenuation={(width) => width}>
          <mesh position={[3.5, 0, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color="#fafaf9"
              metalness={0.5}
              roughness={0.3}
              emissive="#c9a962"
              emissiveIntensity={0.7}
            />
          </mesh>
        </Trail>
      </group>
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
      <Atom />
    </>
  );
}

export function AtomScene() {
  return (
    <div className="absolute top-20 right-0 w-[600px] h-[600px] z-0 opacity-30">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
