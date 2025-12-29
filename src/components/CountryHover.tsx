import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Calculate centroid of a polygon
function calculateCentroid(coordinates: number[][]): [number, number] {
  let sumLat = 0;
  let sumLng = 0;
  coordinates.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return [sumLat / coordinates.length, sumLng / coordinates.length];
}

// Check if a point is inside a polygon using ray casting
function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// GeoJSON types
interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

interface GeoJSONFeature {
  type: string;
  geometry: GeoJSONGeometry;
  properties: {
    name?: string;
    ADMIN?: string;
    NAME?: string;
    [key: string]: unknown;
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

interface PolygonRing {
  points: number[][];
}

interface CountryData {
  name: string;
  rings: PolygonRing[]; // All rings (outer + holes) for border rendering
  outerRings: number[][][]; // Just outer rings for point-in-polygon
  centroid: [number, number];
}

// Zoom threshold - only show hover when camera is closer than this
const ZOOM_THRESHOLD = 5.5;

export function CountryHover({ radius = 2 }: { radius?: number }) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  const sphereRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, pointer } = useThree();

  // Fetch GeoJSON data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load country data:', err));
  }, []);

  // Process GeoJSON into country data
  const countries = useMemo(() => {
    if (!geoData) return [];

    const result: CountryData[] = [];

    geoData.features.forEach((feature) => {
      const { geometry, properties } = feature;
      const countryName = properties.name || properties.ADMIN || properties.NAME || 'Unknown';

      const rings: PolygonRing[] = [];
      const outerRings: number[][][] = [];
      let mainCentroid: [number, number] = [0, 0];
      let largestPolygonSize = 0;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        // Add all rings (outer + holes) for border rendering
        coords.forEach((ring) => {
          rings.push({ points: ring });
        });
        outerRings.push(coords[0]);
        mainCentroid = calculateCentroid(coords[0]);
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        coords.forEach((polygon) => {
          // Add all rings from this polygon
          polygon.forEach((ring) => {
            rings.push({ points: ring });
          });
          outerRings.push(polygon[0]);

          if (polygon[0].length > largestPolygonSize) {
            largestPolygonSize = polygon[0].length;
            mainCentroid = calculateCentroid(polygon[0]);
          }
        });
      }

      if (rings.length > 0) {
        result.push({
          name: countryName,
          rings,
          outerRings,
          centroid: mainCentroid,
        });
      }
    });

    return result;
  }, [geoData]);

  // Convert 3D intersection point to lat/lng
  const vector3ToLatLng = useCallback((point: THREE.Vector3): [number, number] => {
    const normalized = point.clone().normalize();
    const lat = Math.asin(normalized.y) * (180 / Math.PI);
    const lng = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
    return [lat, lng < -180 ? lng + 360 : lng];
  }, []);

  // Find which country contains the given lat/lng point
  const findCountryAtPoint = useCallback((lat: number, lng: number): CountryData | null => {
    for (const country of countries) {
      for (const outerRing of country.outerRings) {
        if (pointInPolygon([lng, lat], outerRing)) {
          return country;
        }
      }
    }
    return null;
  }, [countries]);

  // Check camera distance and perform raycasting each frame
  useFrame(() => {
    const distance = camera.position.length();
    const zoomed = distance < ZOOM_THRESHOLD;
    setIsZoomedIn(zoomed);

    if (!zoomed || !sphereRef.current) {
      if (hoveredCountry) {
        setHoveredCountry(null);
      }
      return;
    }

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(sphereRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const [lat, lng] = vector3ToLatLng(point);

      const country = findCountryAtPoint(lat, lng);
      if (country !== hoveredCountry) {
        setHoveredCountry(country);
      }
    } else {
      if (hoveredCountry) {
        setHoveredCountry(null);
      }
    }
  });

  // Create border lines for the hovered country
  const borderLines = useMemo(() => {
    if (!hoveredCountry) return [];

    return hoveredCountry.rings.map((ring, ringIndex) => {
      const points: THREE.Vector3[] = [];

      ring.points.forEach(([lng, lat]) => {
        points.push(latLngToVector3(lat, lng, radius + 0.005));
      });

      // Close the ring
      if (ring.points.length > 0) {
        const [lng, lat] = ring.points[0];
        points.push(latLngToVector3(lat, lng, radius + 0.005));
      }

      return { points, key: `ring-${ringIndex}` };
    });
  }, [hoveredCountry, radius]);

  // Calculate label position
  const labelPosition = useMemo(() => {
    if (!hoveredCountry) return null;
    return latLngToVector3(hoveredCountry.centroid[0], hoveredCountry.centroid[1], radius + 0.05);
  }, [hoveredCountry, radius]);

  if (!geoData) {
    return null;
  }

  return (
    <group>
      {/* Invisible sphere for raycasting */}
      <mesh ref={sphereRef} visible={false}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Highlight borders for hovered country */}
      {hoveredCountry && isZoomedIn && borderLines.map(({ points, key }) => (
        <Line
          key={key}
          points={points}
          color="#00f5ff"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      ))}

      {/* Country label */}
      {hoveredCountry && labelPosition && isZoomedIn && (
        <Html
          position={labelPosition}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="country-label">
            {hoveredCountry.name}
          </div>
        </Html>
      )}
    </group>
  );
}
