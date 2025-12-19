import { useMemo, useEffect, useState } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import earcut from 'earcut';

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}

// Triangulate a polygon ring for 3D rendering
function triangulatePolygon(ring: number[][], radius: number): THREE.BufferGeometry | null {
  if (ring.length < 3) return null;

  // Flatten coordinates for earcut
  const flatCoords: number[] = [];
  ring.forEach(([lng, lat]) => {
    flatCoords.push(lng, lat);
  });

  // Triangulate using earcut
  const indices = earcut(flatCoords, undefined, 2);
  if (indices.length === 0) return null;

  // Create 3D vertices
  const vertices: number[] = [];
  ring.forEach(([lng, lat]) => {
    const [x, y, z] = latLngToVector3(lat, lng, radius);
    vertices.push(x, y, z);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// GeoJSON types
interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

interface GeoJSONFeature {
  type: string;
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

export function CountryBorders({ radius = 2 }: { radius?: number }) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);

  // Fetch GeoJSON data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load country data:', err));
  }, []);

  // Create line points and filled polygons from GeoJSON
  const { lineData, landGeometries } = useMemo(() => {
    if (!geoData) return { lineData: [], landGeometries: [] };

    const lines: Array<[number, number, number][]> = [];
    const geometries: THREE.BufferGeometry[] = [];

    geoData.features.forEach((feature) => {
      const { geometry } = feature;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        coords.forEach((ring, ringIndex) => {
          const points: [number, number, number][] = ring.map(([lng, lat]) =>
            latLngToVector3(lat, lng, radius + 0.002)
          );
          if (points.length > 1) {
            lines.push(points);
          }
          // Only triangulate outer ring (index 0)
          if (ringIndex === 0) {
            const geo = triangulatePolygon(ring, radius + 0.001);
            if (geo) geometries.push(geo);
          }
        });
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        coords.forEach((polygon) => {
          polygon.forEach((ring, ringIndex) => {
            const points: [number, number, number][] = ring.map(([lng, lat]) =>
              latLngToVector3(lat, lng, radius + 0.002)
            );
            if (points.length > 1) {
              lines.push(points);
            }
            // Only triangulate outer ring (index 0)
            if (ringIndex === 0) {
              const geo = triangulatePolygon(ring, radius + 0.001);
              if (geo) geometries.push(geo);
            }
          });
        });
      }
    });

    return { lineData: lines, landGeometries: geometries };
  }, [geoData, radius]);

  // Merge all land geometries into one for performance
  const mergedLandGeometry = useMemo(() => {
    if (landGeometries.length === 0) return null;
    return mergeGeometries(landGeometries);
  }, [landGeometries]);

  if (!geoData) {
    // Show a subtle loading wireframe while data loads
    return (
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color="#00f5ff" wireframe transparent opacity={0.1} />
      </mesh>
    );
  }

  return (
    <group>
      {/* Filled land masses - dark color to contrast with ocean */}
      {mergedLandGeometry && (
        <mesh geometry={mergedLandGeometry}>
          <meshBasicMaterial color="#0a0a12" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Country border lines */}
      {lineData.map((points, index) => (
        <Line
          key={index}
          points={points}
          color="#00f5ff"
          lineWidth={1}
          transparent
          opacity={0.7}
        />
      ))}
    </group>
  );
}
