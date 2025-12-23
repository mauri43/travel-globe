import { useMemo, useEffect, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Earcut from 'earcut';

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

// GeoJSON types
interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

interface GeoJSONFeature {
  type: string;
  geometry: GeoJSONGeometry;
  properties: {
    ADMIN?: string;
    ISO_A3?: string;
    [key: string]: unknown;
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

interface CountryMesh {
  name: string;
  geometry: THREE.BufferGeometry;
  centroid: THREE.Vector3;
}

// Zoom threshold - only show hover when camera is closer than this
const ZOOM_THRESHOLD = 5.5;

export function CountryHover({ radius = 2 }: { radius?: number }) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [labelPosition, setLabelPosition] = useState<THREE.Vector3 | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  const { camera, raycaster, pointer } = useThree();

  // Fetch GeoJSON data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load country data:', err));
  }, []);

  // Create country mesh data from GeoJSON
  const countryMeshes = useMemo(() => {
    if (!geoData) return [];

    const meshes: CountryMesh[] = [];

    geoData.features.forEach((feature) => {
      const { geometry, properties } = feature;
      const countryName = properties.ADMIN || properties.ISO_A3 || 'Unknown';

      const processPolygon = (ring: number[][]): THREE.BufferGeometry | null => {
        if (ring.length < 3) return null;

        // Flatten coordinates for earcut
        const flatCoords: number[] = [];
        ring.forEach(([lng, lat]) => {
          flatCoords.push(lng, lat);
        });

        // Triangulate using earcut
        const indices = Earcut(flatCoords);
        if (indices.length === 0) return null;

        // Create 3D vertices
        const vertices: number[] = [];
        ring.forEach(([lng, lat]) => {
          const pos = latLngToVector3(lat, lng, radius + 0.001);
          vertices.push(pos.x, pos.y, pos.z);
        });

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
      };

      let mainRing: number[][] | null = null;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        mainRing = coords[0]; // Outer ring
        const geo = processPolygon(mainRing);
        if (geo) {
          const centroid = calculateCentroid(mainRing);
          meshes.push({
            name: countryName,
            geometry: geo,
            centroid: latLngToVector3(centroid[0], centroid[1], radius + 0.01),
          });
        }
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        // Find the largest polygon for centroid calculation
        let largestArea = 0;
        let largestRing: number[][] | null = null;

        coords.forEach((polygon) => {
          const ring = polygon[0];
          // Approximate area by number of points (simple heuristic)
          if (ring.length > largestArea) {
            largestArea = ring.length;
            largestRing = ring;
          }

          const geo = processPolygon(ring);
          if (geo) {
            const centroid = calculateCentroid(ring);
            meshes.push({
              name: countryName,
              geometry: geo,
              centroid: latLngToVector3(centroid[0], centroid[1], radius + 0.01),
            });
          }
        });

        // Update centroid to use largest polygon
        if (largestRing && meshes.length > 0) {
          const lastMeshIndex = meshes.length - 1;
          const centroid = calculateCentroid(largestRing);
          meshes[lastMeshIndex].centroid = latLngToVector3(centroid[0], centroid[1], radius + 0.01);
        }
      }
    });

    return meshes;
  }, [geoData, radius]);

  // Check camera distance and perform raycasting each frame
  useFrame(() => {
    // Check zoom level
    const distance = camera.position.length();
    const zoomed = distance < ZOOM_THRESHOLD;
    setIsZoomedIn(zoomed);

    if (!zoomed || !groupRef.current) {
      if (hoveredCountry) {
        setHoveredCountry(null);
        setLabelPosition(null);
      }
      return;
    }

    // Perform raycasting
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(meshesRef.current, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const countryName = mesh.userData.countryName;
      const centroid = mesh.userData.centroid as THREE.Vector3;

      if (countryName !== hoveredCountry) {
        setHoveredCountry(countryName);
        setLabelPosition(centroid);
      }
    } else {
      if (hoveredCountry) {
        setHoveredCountry(null);
        setLabelPosition(null);
      }
    }
  });

  // Store mesh refs
  const setMeshRef = (index: number) => (mesh: THREE.Mesh | null) => {
    if (mesh) {
      meshesRef.current[index] = mesh;
    }
  };

  if (!geoData || countryMeshes.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* Invisible meshes for raycasting, visible highlight on hover */}
      {countryMeshes.map((country, index) => (
        <mesh
          key={`${country.name}-${index}`}
          ref={setMeshRef(index)}
          geometry={country.geometry}
          userData={{ countryName: country.name, centroid: country.centroid }}
        >
          <meshBasicMaterial
            color={hoveredCountry === country.name ? '#00f5ff' : '#000000'}
            transparent
            opacity={hoveredCountry === country.name && isZoomedIn ? 0.25 : 0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
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
            {hoveredCountry}
          </div>
        </Html>
      )}
    </group>
  );
}
