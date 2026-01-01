"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function Crystal() {
  const groupRef = useRef<THREE.Group>(null);
  const crystal1Ref = useRef<THREE.Mesh>(null);
  const crystal2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.06;
    }
    if (crystal1Ref.current) {
      crystal1Ref.current.rotation.y = state.clock.elapsedTime * 0.1;
      crystal1Ref.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
    if (crystal2Ref.current) {
      crystal2Ref.current.rotation.y = -state.clock.elapsedTime * 0.08;
      crystal2Ref.current.rotation.z = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <mesh ref={crystal1Ref} position={[0, 0, 0]} scale={1.5}>
          <octahedronGeometry args={[1, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.4}
            chromaticAberration={0.08}
            anisotropy={0.5}
            distortion={0.3}
            distortionScale={0.4}
            temporalDistortion={0.2}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            color="#c9a962"
            transmission={0.95}
            opacity={1}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={crystal2Ref} position={[0, 0, 0]} scale={2}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#c9a962"
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      </Float>

      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 2.8;
        return (
          <Float key={i} speed={1 + i * 0.1} rotationIntensity={0.15} floatIntensity={0.3}>
            <mesh
              position={[
                Math.cos(angle) * radius,
                Math.sin(i) * 0.5,
                Math.sin(angle) * radius,
              ]}
              rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
              scale={0.25}
            >
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color="#c9a962"
                metalness={1}
                roughness={0}
                emissive="#c9a962"
                emissiveIntensity={0.4}
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
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#c9a962" />
      <Crystal />
    </>
  );
}

export function CrystalScene() {
  return (
    <div className="absolute top-0 right-0 w-1/2 h-[80vh] z-0 opacity-35">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
