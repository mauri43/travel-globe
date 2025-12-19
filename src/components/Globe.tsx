import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CityMarker } from './CityMarker';
import { CountryBorders } from './CountryBorders';
import { FlightPaths } from './FlightPaths';
import { useStore } from '../store';

// Convert lat/lng to 3D position on sphere
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Custom shader for glowing atmosphere effect
const glowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float glow = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(glowColor, glow * intensity);
  }
`;

export function Globe() {
  const globeRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const cities = useStore((state) => state.cities);
  const activeTagFilters = useStore((state) => state.activeTagFilters);

  // Filter cities based on active tag filters
  const filteredCities = useMemo(() => {
    if (activeTagFilters.length === 0) return cities;
    return cities.filter((city) =>
      activeTagFilters.some((tag) => city.tags.includes(tag))
    );
  }, [cities, activeTagFilters]);

  // Glow material for atmosphere - reduced intensity
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x00f5ff) },
        intensity: { value: 0.3 },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
  }, []);

  // Animation loop for atmosphere pulsing - reduced range
  useFrame((state) => {
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.ShaderMaterial;
      material.uniforms.intensity.value = 0.25 + Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Inner dark sphere - the globe base */}
      <mesh>
        <sphereGeometry args={[1.99, 64, 64]} />
        <meshBasicMaterial color="#0a0a12" />
      </mesh>

      {/* Country borders - real geographic outlines */}
      <CountryBorders radius={2} />

      {/* Outer glow effect - atmosphere (reduced) */}
      <mesh ref={glowRef} scale={1.08}>
        <sphereGeometry args={[2, 64, 64]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Flight paths with planes */}
      <FlightPaths globeRadius={2} />

      {/* City markers */}
      {filteredCities.map((city) => (
        <CityMarker key={city.id} city={city} globeRadius={2} />
      ))}
    </group>
  );
}
