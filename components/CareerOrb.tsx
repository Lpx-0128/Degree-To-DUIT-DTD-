'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface CareerOrbProps {
  skillCount: number;
  gapStatus: any;
  isGenerating: boolean;
  hasResult: boolean;
  hoveredSkill: string | null;
  skillsList: string[];
}

function CameraRig({ hasResult }: { hasResult: boolean }) {
  useFrame((state) => {
    const isMobile = window.innerWidth < 1024;
    const targetX = hasResult ? (isMobile ? 0 : 3) : 0;
    const targetY = hasResult ? (isMobile ? -2 : 0) : 0;
    const targetZ = hasResult ? 6 : 8;
    
    state.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.03);
  });
  return null;
}

export default function CareerOrb({ skillCount, gapStatus, isGenerating, hasResult, hoveredSkill, skillsList }: CareerOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const targetScale = Math.min(1 + skillCount * 0.1, 2.5);
  const targetDistort = Math.max(0.8 - skillCount * 0.05, 0.2);
  const targetSpeed = Math.max(4 - skillCount * 0.2, 1);

  const particlesData = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) {
      positions[i] = (Math.random() - 0.5) * 4;
    }
    return positions;
  }, []);

  useEffect(() => {
    if (isGenerating && meshRef.current && materialRef.current) {
      gsap.to(meshRef.current.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 2,
        ease: "power2.out"
      });

      gsap.to(materialRef.current, {
        distort: targetDistort,
        speed: targetSpeed,
        duration: 2,
        ease: "power2.out"
      });

      const colorObj = { r: 59/255, g: 130/255, b: 246/255 }; 
      const targetColor = new THREE.Color('#eab308'); 
      
      gsap.to(colorObj, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 2,
        ease: "power2.out",
        onUpdate: () => {
          if (materialRef.current) {
            materialRef.current.color.setRGB(colorObj.r, colorObj.g, colorObj.b);
          }
        }
      });
    } else if (!isGenerating && skillCount === 0 && meshRef.current && materialRef.current) {
      gsap.to(meshRef.current.scale, { x: 1, y: 1, z: 1, duration: 1 });
      gsap.to(materialRef.current, { distort: 0.8, speed: 4, duration: 1 });
      
      const colorObj = { r: materialRef.current.color.r, g: materialRef.current.color.g, b: materialRef.current.color.b };
      const targetColor = new THREE.Color('#3b82f6');
      gsap.to(colorObj, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 1,
        onUpdate: () => {
          if (materialRef.current) {
            materialRef.current.color.setRGB(colorObj.r, colorObj.g, colorObj.b);
          }
        }
      });
    }
  }, [isGenerating, skillCount, targetScale, targetDistort, targetSpeed]);

  useEffect(() => {
    if (hoveredSkill && meshRef.current && materialRef.current) {
      gsap.to(meshRef.current.scale, {
        x: targetScale * 1.1,
        y: targetScale * 1.1,
        z: targetScale * 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1
      });
      
      const colorObj = { r: materialRef.current.color.r, g: materialRef.current.color.g, b: materialRef.current.color.b };
      const targetColor = new THREE.Color('#10b981'); 
      gsap.to(colorObj, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        onUpdate: () => {
          if (materialRef.current) {
            materialRef.current.color.setRGB(colorObj.r, colorObj.g, colorObj.b);
          }
        }
      });
    }
  }, [hoveredSkill, targetScale]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (particlesRef.current && hoveredSkill) {
      particlesRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <>
      <CameraRig hasResult={hasResult} />
      <group>
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            ref={materialRef}
            color="#3b82f6"
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.5}
            roughness={0.2}
            distort={0.8}
            speed={4}
          />
        </Sphere>

        {hoveredSkill && (
          <points ref={particlesRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={particlesData.length / 3}
                array={particlesData}
                itemSize={3}
                args={[particlesData, 3]}
              />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#10b981" transparent opacity={0.6} />
          </points>
        )}

        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2} far={4} color="#000000" />

        {hasResult && skillsList && skillsList.map((skill, i) => {
          const phi = Math.acos(-1 + (2 * i) / skillsList.length);
          const theta = Math.sqrt(skillsList.length * Math.PI) * phi;
          const r = targetScale + 0.5;
          const x = r * Math.cos(theta) * Math.sin(phi);
          const y = r * Math.sin(theta) * Math.sin(phi);
          const z = r * Math.cos(phi);

          return (
            <Html key={i} position={[x, y, z]} center className="pointer-events-none">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 px-2 py-1 rounded-md text-xs text-white whitespace-nowrap opacity-80">
                {skill}
              </div>
            </Html>
          );
        })}
      </group>
    </>
  );
}
