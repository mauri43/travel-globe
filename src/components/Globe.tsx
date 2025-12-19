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

// Ocean depth shader - creates a deep blue gradient effect
const oceanVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const oceanFragmentShader = `
  uniform vec3 deepColor;
  uniform vec3 shallowColor;
  uniform vec3 viewPosition;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    // Create depth effect based on view angle
    vec3 viewDir = normalize(viewPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);

    // Mix colors based on position and fresnel
    float depthFactor = 0.5 + 0.5 * vPosition.y / 2.0; // Varies with latitude
    vec3 oceanColor = mix(deepColor, shallowColor, fresnel * 0.5 + depthFactor * 0.3);

    // Add subtle variation
    float noise = fract(sin(dot(vUv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    oceanColor += noise * 0.008;

    gl_FragColor = vec4(oceanColor, 1.0);
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

  // Check if a city/location is in the US
  const isUSLocation = (country: string | undefined, name?: string): boolean => {
    if (country?.toLowerCase().includes('united states') || country?.toLowerCase() === 'usa' || country?.toLowerCase() === 'us') {
      return true;
    }
    // Check for common US airport codes or city patterns in the name
    const usAirportCodes = ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'MCO', 'EWR', 'MIA', 'PHX', 'IAH', 'BOS', 'MSP', 'DTW', 'FLL', 'PHL', 'LGA', 'BWI', 'SLC', 'DCA', 'IAD', 'SAN', 'TPA', 'PDX', 'STL', 'HNL', 'BNA', 'AUS', 'OAK', 'SMF', 'SJC', 'RDU', 'CLE', 'MCI', 'SAT', 'IND', 'PIT', 'CMH', 'CVG', 'MKE', 'JAX', 'OMA', 'ABQ', 'ANC', 'BUF', 'OKC', 'RIC', 'TUL', 'SDF', 'GRR', 'BOI', 'BDL', 'ONT', 'PBI', 'RSW', 'ORF', 'BHM', 'TUS', 'ELP', 'ALB', 'ROC', 'SYR', 'PWM', 'DSM', 'LIT', 'GSO', 'RNO', 'CHS', 'MSY', 'ATL'];
    if (name) {
      const upperName = name.toUpperCase();
      if (usAirportCodes.some(code => upperName.includes(code))) {
        return true;
      }
    }
    return false;
  };

  // Get unique origin cities that aren't layovers (have unique coordinates)
  const originMarkers = useMemo(() => {
    const origins: Array<{
      id: string;
      name: string;
      coordinates: { lat: number; lng: number };
      isUS: boolean;
    }> = [];
    const seenCoords = new Set<string>();

    // First, mark all destination coordinates as "seen" so we don't duplicate
    filteredCities.forEach(city => {
      const key = `${city.coordinates.lat.toFixed(2)},${city.coordinates.lng.toFixed(2)}`;
      seenCoords.add(key);
    });

    // Now collect unique origins
    filteredCities.forEach(city => {
      if (city.flewFrom?.coordinates) {
        const { lat, lng } = city.flewFrom.coordinates;
        const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;

        // Skip if we already have a marker at this location (destination or another origin)
        if (!seenCoords.has(key)) {
          seenCoords.add(key);
          origins.push({
            id: `origin-${city.id}`,
            name: city.flewFrom.name,
            coordinates: { lat, lng },
            isUS: isUSLocation(undefined, city.flewFrom.name),
          });
        }
      }
    });

    return origins;
  }, [filteredCities]);

  // Ocean material for deep blue water effect
  const oceanMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        deepColor: { value: new THREE.Color(0x050a12) },     // Very deep navy
        shallowColor: { value: new THREE.Color(0x0d1a2d) },  // Slightly lighter blue
        viewPosition: { value: new THREE.Vector3(0, 0, 5) },
      },
      vertexShader: oceanVertexShader,
      fragmentShader: oceanFragmentShader,
    });
  }, []);

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
      {/* Inner ocean sphere - deep blue water effect */}
      <mesh>
        <sphereGeometry args={[1.99, 64, 64]} />
        <primitive object={oceanMaterial} attach="material" />
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

      {/* Destination city markers */}
      {filteredCities.map((city) => (
        <CityMarker
          key={city.id}
          city={city}
          globeRadius={2}
          isUS={isUSLocation(city.country, city.name)}
        />
      ))}

      {/* Origin city markers */}
      {originMarkers.map((origin) => (
        <CityMarker
          key={origin.id}
          city={{
            id: origin.id,
            name: origin.name,
            country: '',
            coordinates: origin.coordinates,
            dates: [],
            photos: [],
            videos: [],
            memories: '',
            tags: [],
          }}
          globeRadius={2}
          isUS={origin.isUS}
          isOrigin={true}
          originName={origin.name}
        />
      ))}
    </group>
  );
}
