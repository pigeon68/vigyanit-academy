"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial, ContactShadows } from "@react-three/drei";
import { useRef, Suspense, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

function Satellite({ radius, speed, color, scale, phase = 0, type = 'octahedron' }: { radius: number, speed: number, color: string, scale: number, phase: number, type?: 'octahedron' | 'sphere' | 'box' }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * speed + phase;
    }
  });

  return (
    <group ref={ref}>
      <mesh position={[radius, 0, 0]} scale={scale}>
        {type === 'octahedron' ? (
          <octahedronGeometry args={[1, 0]} />
        ) : type === 'sphere' ? (
          <sphereGeometry args={[1, 8, 8]} />
        ) : (
          <boxGeometry args={[1, 1, 1]} />
        )}
        <meshStandardMaterial color={color} metalness={1} roughness={0.1} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function GeometricSculpture() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Group | null)[]>([]);
  const coreRef = useRef<THREE.Group>(null);
  const orbitalPointsRef = useRef<THREE.Group>(null);

  const [particles, setParticles] = useState<{
    position: [number, number, number],
    scale: number,
    speed: number,
    phase: number,
    type: 'sphere' | 'box' | 'octahedron',
    color: string
  }[]>([]);

  useEffect(() => {
    const newParticles = [...Array(80)].map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
      ] as [number, number, number],
      scale: 0.01 + Math.random() * 0.04,
      speed: 0.1 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      type: (i % 3 === 0 ? 'sphere' : i % 3 === 1 ? 'box' : 'octahedron') as any,
      color: i % 4 === 0 ? "#c9a962" : i % 4 === 1 ? "#ffffff" : "#d4d4d8"
    }));
    setParticles(newParticles);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03;
      groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.05;
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = -t * 0.4;
      coreRef.current.rotation.x = Math.sin(t * 0.2) * 0.2;
      const pulse = 1 + Math.sin(t * 0.8) * 0.08;
      coreRef.current.scale.setScalar(pulse);
    }

    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        const speed = 0.05 + (i * 0.02);
        const direction = i % 2 === 0 ? 1 : -1;
        ring.rotation.x = t * speed * direction;
        ring.rotation.y = t * speed * 0.5 * direction;
        ring.rotation.z = Math.sin(t * 0.1 + i) * 0.1;
      }
    });

    if (orbitalPointsRef.current) {
      orbitalPointsRef.current.rotation.y = t * 0.1;
    }
  });

  const rings = [
    { radius: 3.5, width: 0.03, opacity: 0.8, detail: 150, satellites: 3 },
    { radius: 4.2, width: 0.015, opacity: 0.5, detail: 120, satellites: 2 },
    { radius: 5.0, width: 0.008, opacity: 0.3, detail: 100, satellites: 4 },
    { radius: 5.8, width: 0.02, opacity: 0.6, detail: 140, wireframe: true, satellites: 3 },
    { radius: 6.5, width: 0.005, opacity: 0.4, detail: 90, satellites: 2 },
    { radius: 7.2, width: 0.01, opacity: 0.2, detail: 80, satellites: 1 },
  ];

  return (
    <group ref={groupRef}>
      {/* Central Ethereal Core */}
      <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
          <group ref={coreRef}>
            {/* Main Glass Shell */}
              <mesh renderOrder={1}>
                <icosahedronGeometry args={[1.2, 8]} />
                <MeshTransmissionMaterial
                  backside
                  samples={12}
                  thickness={1}
                  chromaticAberration={0.15}
                  anisotropy={0.5}
                  distortion={0.2}
                  distortionScale={0.1}
                  color="#ffffff"
                  roughness={0.05}
                  transmission={1}
                />
              </mesh>
            
            {/* Inner Golden Core */}
            <mesh scale={0.3}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial 
                color="#c9a962" 
                metalness={1} 
                roughness={0.1} 
                emissive="#c9a962" 
                emissiveIntensity={1.2} 
              />
            </mesh>

            {/* Core Glow */}
            <pointLight intensity={1.5} distance={10} color="#c9a962" />
          </group>
      </Float>

      {/* Complex Orbital System */}
      {rings.map((ring, i) => (
        <group key={i} ref={(el) => { ringRefs.current[i] = el; }}>
          <group rotation={[Math.PI / (2 + i * 0.2), 0, 0]}>
            <mesh>
              <torusGeometry args={[ring.radius, ring.width, 16, ring.detail]} />
                <meshStandardMaterial 
                  color="#c9a962" 
                  metalness={1} 
                  roughness={0.1} 
                  transparent 
                  opacity={ring.opacity}
                  wireframe={ring.wireframe}
                  depthWrite={false}
                />
            </mesh>
            
            {/* Orbital Satellites */}
            {[...Array(ring.satellites)].map((_, j) => (
              <Satellite 
                key={j} 
                radius={ring.radius} 
                speed={(0.2 + Math.random() * 0.4) * (j % 2 === 0 ? 1 : -1)} 
                color={j % 2 === 0 ? "#c9a962" : "#ffffff"}
                scale={0.04 + Math.random() * 0.06}
                phase={(j * Math.PI * 2) / ring.satellites + Math.random()}
                type={j % 3 === 0 ? 'octahedron' : j % 3 === 1 ? 'sphere' : 'box'}
              />
            ))}
          </group>
        </group>
      ))}

      {/* Particle Web */}
      <group ref={orbitalPointsRef}>
        {particles.slice(0, 30).map((p, i) => (
          <mesh key={`orbital-${i}`} position={p.position} scale={p.scale}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshStandardMaterial color="#c9a962" emissive="#c9a962" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>

      {/* Floating Knowledge Particles */}
      {particles.map((particle, i) => (
        <Float key={`float-${i}`} speed={particle.speed} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={particle.position} scale={particle.scale}>
            {particle.type === 'sphere' ? (
              <sphereGeometry args={[1, 6, 6]} />
            ) : particle.type === 'box' ? (
              <boxGeometry args={[1, 1, 1]} />
            ) : (
              <octahedronGeometry args={[1, 0]} />
            )}
              <meshStandardMaterial 
                color={particle.color} 
                emissive={particle.color}
                emissiveIntensity={0.2}
                transparent
                opacity={0.6}
                metalness={0.8}
                depthWrite={false}
              />
          </mesh>
        </Float>
      ))}

      {/* Distant Starfield for Depth */}
      <group>
        {[...Array(150)].map((_, i) => (
          <mesh
            key={`star-${i}`}
            position={[
              (Math.random() - 0.5) * 50,
              (Math.random() - 0.5) * 50,
              (Math.random() - 0.5) * 50,
            ]}
          >
            <sphereGeometry args={[0.005 + Math.random() * 0.01, 4, 4]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.1 + Math.random() * 0.2} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, 5, -5]} intensity={1} color="#c9a962" />
      <GeometricSculpture />
      <ContactShadows 
         opacity={0.1} 
         scale={20} 
         blur={3} 
         far={10} 
         resolution={256} 
         color="#c9a962"
         position={[0, -5, 0]}
      />
    </>
  );
}

export function StudyScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 13], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafaf9]" />
    </div>
  );
}
