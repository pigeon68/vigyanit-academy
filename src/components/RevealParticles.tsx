"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  delay: number;
}

export function RevealParticles({ 
  children, 
  className = "",
  particleCount = 12,
  particleColor = "#c9a962"
}: { 
  children: React.ReactNode;
  className?: string;
  particleCount?: number;
  particleColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (isInView && !hasTriggered) {
      setHasTriggered(true);
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
          case 0: x = Math.random() * 100; y = 0; break;
          case 1: x = 100; y = Math.random() * 100; break;
          case 2: x = Math.random() * 100; y = 100; break;
          default: x = 0; y = Math.random() * 100; break;
        }

        newParticles.push({
          id: i,
          x,
          y,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          velocityX: (Math.random() - 0.5) * 30,
          velocityY: (Math.random() - 0.5) * 30,
          delay: Math.random() * 0.3,
        });
      }
      
      setParticles(newParticles);
    }
  }, [isInView, hasTriggered, particleCount]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particleColor,
            borderRadius: "50%",
          }}
          initial={{ 
            opacity: 0,
            scale: 0,
          }}
          animate={{ 
            opacity: [0, particle.opacity, particle.opacity, 0],
            scale: [0, 1, 1, 0.5],
            x: particle.velocityX,
            y: particle.velocityY,
          }}
          transition={{
            duration: 1.5,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
      {children}
    </div>
  );
}

export function FloatingParticles({
  className = "",
  count = 20,
}: {
  className?: string;
  count?: number;
}) {
  const [particles, setParticles] = useState<{id: number, x: number, y: number, size: number, duration: number, delay: number}[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    })));
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: "#c9a962",
            borderRadius: "50%",
            opacity: 0.15,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
