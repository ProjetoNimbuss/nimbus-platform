"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function RainParticles({ count = 1500 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Memoize as propriedades iniciais de cada gota de chuva
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = -25 + Math.random() * 50;
      const y = -25 + Math.random() * 50;
      const z = -25 + Math.random() * 50;
      // Velocidade aleatória para simular gotas caindo
      const speed = 0.15 + Math.random() * 0.2;
      temp.push({ x, y, z, speed });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      // Faz a gota cair
      particle.y -= particle.speed;
      
      // Se cair muito, recria lá no topo
      if (particle.y < -20) {
        particle.y = 25;
        particle.x = -25 + Math.random() * 50;
        particle.z = -25 + Math.random() * 50;
      }
      
      dummy.position.set(particle.x, particle.y, particle.z);
      // Estica a esfera em Y para parecer uma gota
      dummy.scale.set(0.02, 0.4, 0.02);
      dummy.updateMatrix();
      
      if (mesh.current) {
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
    });
    
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      {/* Azul sutil para não pesar a leitura dos dados */}
      <meshBasicMaterial color="#0ea5e9" transparent opacity={0.15} />
    </instancedMesh>
  );
}

export default function Atmosphere3D() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <RainParticles count={2000} />
      </Canvas>
    </div>
  );
}
