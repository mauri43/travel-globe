import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShootingStar {
  id: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  life: number;
  maxLife: number;
}

function ShootingStarMesh({ star, onComplete }: { star: ShootingStar; onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef(star.position.clone());
  const lifeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    lifeRef.current += delta;

    if (lifeRef.current >= star.maxLife) {
      onComplete();
      return;
    }

    // Move the star
    positionRef.current.add(star.direction.clone().multiplyScalar(star.speed * delta));
    groupRef.current.position.copy(positionRef.current);

    // Update opacity based on life
    const progress = lifeRef.current / star.maxLife;
    const opacity = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

    // Update children materials
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity = opacity * 0.8;
      }
    });
  });

  // Create trail points
  const trailLength = 12;
  const trailPoints = [];
  for (let i = 0; i < trailLength; i++) {
    const t = i / trailLength;
    const offset = star.direction.clone().multiplyScalar(-t * 2);
    trailPoints.push(
      <mesh key={i} position={offset.toArray()}>
        <sphereGeometry args={[0.02 * (1 - t * 0.8), 4, 4]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.6 * (1 - t)}
        />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={star.position}>
      {/* Main star head */}
      <mesh>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.3} />
      </mesh>
      {/* Trail */}
      {trailPoints}
    </group>
  );
}

export function ShootingStars() {
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const spawnStars = () => {
      const newStars: ShootingStar[] = [];

      for (let i = 0; i < 10; i++) {
        const id = nextId.current++;

        // Random position in the visible sky area (around the edges, not center)
        // Spread them across the visible starfield
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y, z;

        // Position in background (behind globe which is at z=0)
        z = -20 - Math.random() * 60;

        switch(side) {
          case 0: // Top
            x = (Math.random() - 0.5) * 80;
            y = 20 + Math.random() * 30;
            break;
          case 1: // Right
            x = 30 + Math.random() * 30;
            y = (Math.random() - 0.5) * 60;
            break;
          case 2: // Bottom-ish (but still visible)
            x = (Math.random() - 0.5) * 80;
            y = -10 - Math.random() * 20;
            break;
          default: // Left
            x = -30 - Math.random() * 30;
            y = (Math.random() - 0.5) * 60;
            break;
        }

        const position = new THREE.Vector3(x, y, z);

        // Direction - diagonal movement
        const direction = new THREE.Vector3(
          -0.5 + Math.random() * 0.3,
          -0.4 - Math.random() * 0.3,
          0
        ).normalize();

        newStars.push({
          id,
          position,
          direction,
          speed: 15 + Math.random() * 10,
          life: 0,
          maxLife: 2 + Math.random() * 1.5,
        });
      }

      setStars((prev) => [...prev, ...newStars]);
    };

    // First batch after 1 second
    const initialTimeout = setTimeout(spawnStars, 1000);

    // Then every 5 seconds
    const interval = setInterval(spawnStars, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const removeStar = (id: number) => {
    setStars((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <group>
      {stars.map((star) => (
        <ShootingStarMesh
          key={star.id}
          star={star}
          onComplete={() => removeStar(star.id)}
        />
      ))}
    </group>
  );
}
