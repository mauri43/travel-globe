import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CityMarker } from './CityMarker';
import { CountryBorders } from './CountryBorders';
import { CountryHover } from './CountryHover';
import { FlightPaths } from './FlightPaths';
import { useStore } from '../store';
import { useSocialStore } from '../store/socialStore';
import { useTheme } from '../hooks/useTheme';
import type { City } from '../types';

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
  const myCities = useStore((state) => state.cities);
  const activeTagFilters = useStore((state) => state.activeTagFilters);
  const activeTripFilters = useStore((state) => state.activeTripFilters);
  const activeYearFilters = useStore((state) => state.activeYearFilters);
  const { currentTheme } = useTheme();

  // Check if viewing someone else's globe
  const viewingGlobe = useSocialStore((state) => state.viewingGlobe);

  // Convert PublicFlight[] to City[] format for rendering
  const viewingCities: City[] = useMemo(() => {
    if (!viewingGlobe) return [];
    return viewingGlobe.map((flight) => ({
      id: flight.id,
      name: flight.destination.name,
      country: flight.destination.country,
      coordinates: {
        lat: flight.destination.lat,
        lng: flight.destination.lng,
      },
      dates: [],
      photos: [],
      videos: [],
      memories: '',
      tags: [],
      flewFrom: {
        name: flight.flewFrom.name,
        coordinates: {
          lat: flight.flewFrom.lat,
          lng: flight.flewFrom.lng,
        },
      },
    }));
  }, [viewingGlobe]);

  // Use viewing cities if viewing someone else's globe, otherwise use own cities
  const cities = viewingGlobe ? viewingCities : myCities;

  // Filter cities based on active filters (tags, trips, years)
  const filteredCities = useMemo(() => {
    const hasTagFilters = activeTagFilters.length > 0;
    const hasTripFilters = activeTripFilters.length > 0;
    const hasYearFilters = activeYearFilters.length > 0;

    if (!hasTagFilters && !hasTripFilters && !hasYearFilters) return cities;

    return cities.filter((city) => {
      // Check tag filter (OR logic - any matching tag)
      const passesTagFilter = !hasTagFilters || activeTagFilters.some((tag) => city.tags.includes(tag));

      // Check trip filter (OR logic - any matching trip)
      const passesTripFilter = !hasTripFilters || (city.tripName && activeTripFilters.includes(city.tripName));

      // Check year filter (OR logic - any matching year)
      const passesYearFilter = !hasYearFilters || (city.dates && city.dates.length > 0 && (() => {
        const year = parseInt(city.dates[0].split('-')[0], 10);
        return activeYearFilters.includes(year);
      })());

      // All active filters must pass (AND logic between filter types)
      return passesTagFilter && passesTripFilter && passesYearFilter;
    });
  }, [cities, activeTagFilters, activeTripFilters, activeYearFilters]);

  // Check if a city/location is in the US
  const isUSLocation = (country: string | undefined, name?: string): boolean => {
    const countryLower = country?.toLowerCase().trim();

    // Check country name variations
    if (countryLower) {
      const usCountryPatterns = ['united states', 'usa', 'u.s.a', 'u.s.', 'us', 'america'];
      if (usCountryPatterns.some(pattern => countryLower === pattern || countryLower.includes('united states'))) {
        return true;
      }
      // If country is explicitly NOT US, return false (don't check airport codes)
      // This prevents false positives from airport codes in city names
      if (countryLower && !usCountryPatterns.some(p => countryLower.includes(p))) {
        return false;
      }
    }

    // Only check airport codes if country is not set
    if (!country && name) {
      const usAirportCodes = ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'MCO', 'EWR', 'MIA', 'PHX', 'IAH', 'BOS', 'MSP', 'DTW', 'FLL', 'PHL', 'LGA', 'BWI', 'SLC', 'DCA', 'IAD', 'SAN', 'TPA', 'PDX', 'STL', 'HNL', 'BNA', 'AUS', 'OAK', 'SMF', 'SJC', 'RDU', 'CLE', 'MCI', 'SAT', 'IND', 'PIT', 'CMH', 'CVG', 'MKE', 'JAX', 'OMA', 'ABQ', 'ANC', 'BUF', 'OKC', 'RIC', 'TUL', 'SDF', 'GRR', 'BOI', 'BDL', 'ONT', 'PBI', 'RSW', 'ORF', 'BHM', 'TUS', 'ELP', 'ALB', 'ROC', 'SYR', 'PWM', 'DSM', 'LIT', 'GSO', 'RNO', 'CHS', 'MSY', 'ATL'];
      // Also check common US city names
      const usCityNames = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington', 'boston', 'nashville', 'baltimore', 'oklahoma city', 'louisville', 'portland', 'las vegas', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'mesa', 'atlanta', 'kansas city', 'colorado springs', 'miami', 'raleigh', 'omaha', 'long beach', 'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'tampa', 'arlington', 'new orleans', 'newark', 'honolulu', 'anaheim', 'henderson', 'orlando', 'st. louis', 'pittsburgh', 'cincinnati', 'anchorage', 'detroit', 'cleveland'];
      const upperName = name.toUpperCase();
      const lowerName = name.toLowerCase();

      if (usAirportCodes.some(code => upperName.includes(code))) {
        return true;
      }
      if (usCityNames.some(city => lowerName.includes(city))) {
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

  // Load land mask texture
  const [landTexture, setLandTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/textures/earth-water.png',
      (texture) => setLandTexture(texture),
      undefined,
      (error) => console.error('Failed to load texture:', error)
    );
  }, []);

  // Ocean/land material with texture-based masking
  const oceanMaterial = useMemo(() => {
    if (!landTexture) {
      // Fallback while loading
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(currentTheme.colors.landColor),
      });
    }

    return new THREE.ShaderMaterial({
      uniforms: {
        landMask: { value: landTexture },
        oceanColor: { value: new THREE.Color(currentTheme.colors.oceanColor) },
        landColor: { value: new THREE.Color(currentTheme.colors.landColor) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D landMask;
        uniform vec3 oceanColor;
        uniform vec3 landColor;
        varying vec2 vUv;

        void main() {
          float mask = texture2D(landMask, vUv).r;
          // earth-water.png: bright = water, dark = land
          // So we mix: high mask = ocean, low mask = land
          vec3 color = mix(landColor, oceanColor, mask);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, [landTexture, currentTheme]);

  // Glow material for atmosphere - reduced intensity
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(currentTheme.colors.glowColor) },
        intensity: { value: 0.3 },
      },
      vertexShader: glowVertexShader,
      fragmentShader: glowFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
  }, [currentTheme]);

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

      {/* Country hover highlight and labels */}
      <CountryHover radius={2} />

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
