import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { City } from '../types';
import { useStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { latLngToVector3 } from './Globe';

interface CityMarkerProps {
  city: City;
  globeRadius: number;
  isUS?: boolean;
  isOrigin?: boolean;
  originName?: string;
}

export function CityMarker({ city, globeRadius, isUS = false, isOrigin = false, originName }: CityMarkerProps) {
  const markerRef = useRef<THREE.Group>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const setSelectedCity = useStore((state) => state.setSelectedCity);
  const { currentTheme } = useTheme();

  // Calculate position on globe surface
  const position = useMemo(() => {
    return latLngToVector3(city.coordinates.lat, city.coordinates.lng, globeRadius);
  }, [city.coordinates, globeRadius]);

  // Calculate rotation to point outward from globe center
  const rotation = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const direction = position.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return euler;
  }, [position]);

  // Pin height - US cities are half height, international full height
  const pinHeight = isUS ? 0.2 : 0.4;
  const dotSize = hovered ? 0.06 : 0.045;

  // Animate glow
  useFrame((state) => {
    if (dotRef.current) {
      const material = dotRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 2 + city.id.charCodeAt(0)) * 0.3 + 0.7;
      material.opacity = hovered ? 1 : pulse;
    }
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = hovered ? 0.9 : 0.6;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Don't open modal for origin markers
    if (!isOrigin) {
      setSelectedCity(city);
    }
  };

  // Display name - use originName for origin markers
  const displayName = isOrigin && originName ? originName : city.name;

  // Colors - US cities are blue, international cities are orange/coral
  const usColor = currentTheme.colors.usMarkerColor;
  const usHoverColor = currentTheme.colors.usMarkerHoverColor;
  const intlColor = currentTheme.colors.intlMarkerColor;
  const intlHoverColor = currentTheme.colors.intlMarkerHoverColor;

  const markerColor = isUS
    ? (hovered ? usHoverColor : usColor)
    : (hovered ? intlHoverColor : intlColor);
  const glowColor = isUS ? usColor : intlColor;

  return (
    <group ref={markerRef} position={position} rotation={rotation}>
      {/* Glow ring at base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.03, 0.08, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={hovered ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical line/pin - extends from surface to dot */}
      <mesh
        ref={lineRef}
        position={[0, pinHeight / 2 + 0.01, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={handleClick}
      >
        <cylinderGeometry args={[0.012, 0.012, pinHeight + 0.02, 8]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.9} />
      </mesh>

      {/* Glowing dot at top */}
      <mesh
        ref={dotRef}
        position={[0, pinHeight + 0.02, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={handleClick}
      >
        <sphereGeometry args={[dotSize, 16, 16]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.9} />
      </mesh>

      {/* Outer glow sphere */}
      <mesh position={[0, pinHeight + 0.02, 0]}>
        <sphereGeometry args={[dotSize * 2, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={hovered ? 0.4 : 0.15}
        />
      </mesh>

      {/* City name tooltip on hover */}
      {hovered && (
        <Html
          position={[0, pinHeight + 0.18, 0]}
          center
          style={{
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="city-tooltip">
            <span className="city-name">{displayName}</span>
            {!isOrigin && <span className="city-country">{city.country}</span>}
            {isOrigin && <span className="city-country origin-label">Origin</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
