import { useMemo, useEffect, useState } from 'react';
import { Line } from '@react-three/drei';
import { useTheme } from '../hooks/useTheme';

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
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
  const { currentTheme } = useTheme();
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);

  // Fetch GeoJSON data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load country data:', err));
  }, []);

  // Create line points from GeoJSON
  const lineData = useMemo(() => {
    if (!geoData) return [];

    const lines: Array<[number, number, number][]> = [];

    geoData.features.forEach((feature) => {
      const { geometry } = feature;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        coords.forEach((ring) => {
          const points: [number, number, number][] = ring.map(([lng, lat]) =>
            latLngToVector3(lat, lng, radius + 0.002)
          );
          if (points.length > 1) {
            lines.push(points);
          }
        });
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates as number[][][][];
        coords.forEach((polygon) => {
          polygon.forEach((ring) => {
            const points: [number, number, number][] = ring.map(([lng, lat]) =>
              latLngToVector3(lat, lng, radius + 0.002)
            );
            if (points.length > 1) {
              lines.push(points);
            }
          });
        });
      }
    });

    return lines;
  }, [geoData, radius]);

  if (!geoData) {
    // Show a subtle loading wireframe while data loads
    return (
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={currentTheme.colors.borderColor} wireframe transparent opacity={0.1} />
      </mesh>
    );
  }

  return (
    <group>
      {/* Country border lines */}
      {lineData.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={currentTheme.colors.borderColor}
          lineWidth={1}
          transparent
          opacity={0.7}
        />
      ))}
    </group>
  );
}
