import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FlightParticleTrailProps {
  path: THREE.Vector3[];
  progress: number; // 0 to 1, where the plane currently is
  color: string;
  particleCount?: number;
  trailLength?: number;
}

export function FlightParticleTrail({
  path,
  progress,
  color,
  particleCount = 30,
  trailLength = 0.15, // 15% of the path behind the plane
}: FlightParticleTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Create curve from path
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(path);
  }, [path]);

  // Create particle geometry
  const { positions, sizes, opacities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const size = new Float32Array(particleCount);
    const opacity = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles along trail
      const t = i / particleCount;
      size[i] = 0.02 * (1 - t * 0.5); // Larger at front, smaller at back
      opacity[i] = 1 - t * 0.8; // More opaque at front
    }

    return { positions: pos, sizes: size, opacities: opacity };
  }, [particleCount]);

  // Create shader material for particles
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;

        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying float vOpacity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          float shimmer = 0.8 + 0.2 * sin(time * 3.0 + gl_PointCoord.x * 10.0);

          gl_FragColor = vec4(color * shimmer, glow * vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  // Update particle positions each frame
  useFrame((state) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.getAttribute('position');

    // Update time uniform for shimmer effect
    material.uniforms.time.value = state.clock.elapsedTime;

    // Calculate particle positions along the trail
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      // Position particles behind the plane
      const pathT = Math.max(0, progress - trailLength * t);

      const point = curve.getPoint(pathT);
      posAttr.setXYZ(i, point.x, point.y, point.z);
    }

    posAttr.needsUpdate = true;
  });

  // Create geometry with attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, [positions, sizes, opacities]);

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
}
