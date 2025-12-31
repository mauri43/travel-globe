import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { useSocialStore } from '../store/socialStore';
import { useTheme } from '../hooks/useTheme';
import { latLngToVector3 } from './Globe';
import { FlightParticleTrail } from './FlightParticleTrail';
import type { City } from '../types';

// Default origin: Washington, DC
const DEFAULT_ORIGIN = {
  lat: 38.9072,
  lng: -77.0369,
};

// Create plane texture from SVG
function createPlaneTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas
  ctx.clearRect(0, 0, 64, 64);

  // Draw plane icon (pointing up/north, will be rotated)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();

  // Airplane shape pointing up (nose at top)
  const cx = 32;
  const cy = 32;

  // Fuselage
  ctx.moveTo(cx, cy - 28); // Nose
  ctx.lineTo(cx + 4, cy - 10);
  ctx.lineTo(cx + 4, cy + 5);

  // Right wing
  ctx.lineTo(cx + 22, cy + 10);
  ctx.lineTo(cx + 22, cy + 15);
  ctx.lineTo(cx + 4, cy + 12);

  // Right tail
  ctx.lineTo(cx + 4, cy + 22);
  ctx.lineTo(cx + 10, cy + 28);
  ctx.lineTo(cx + 10, cy + 30);
  ctx.lineTo(cx, cy + 24);

  // Left tail
  ctx.lineTo(cx - 10, cy + 30);
  ctx.lineTo(cx - 10, cy + 28);
  ctx.lineTo(cx - 4, cy + 22);

  // Left wing
  ctx.lineTo(cx - 4, cy + 12);
  ctx.lineTo(cx - 22, cy + 15);
  ctx.lineTo(cx - 22, cy + 10);
  ctx.lineTo(cx - 4, cy + 5);

  ctx.lineTo(cx - 4, cy - 10);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Shared texture for all planes
let sharedPlaneTexture: THREE.Texture | null = null;

function getPlaneTexture(): THREE.Texture {
  if (!sharedPlaneTexture) {
    sharedPlaneTexture = createPlaneTexture();
  }
  return sharedPlaneTexture;
}

interface FlightPathProps {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  globeRadius: number;
  index: number;
}

function FlightPath({ from, to, globeRadius, index }: FlightPathProps) {
  const { currentTheme } = useTheme();
  const spriteRef = useRef<THREE.Sprite>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const progressRef = useRef(0);

  // Stagger departure times based on index
  const initialDelay = (index * 7) % 30; // Stagger starts

  // Create the curved path that follows the globe surface using true spherical interpolation
  const { curve, pathPoints } = useMemo(() => {
    const start = latLngToVector3(from.lat, from.lng, globeRadius);
    const end = latLngToVector3(to.lat, to.lng, globeRadius);

    // Use quaternion-based spherical interpolation for great circle path
    const startNorm = start.clone().normalize();
    const endNorm = end.clone().normalize();

    // Calculate the angle between the two points
    const dot = startNorm.dot(endNorm);
    const angle = Math.acos(Math.min(1, Math.max(-1, dot)));

    // Calculate arc height based on angular distance (not linear distance)
    const arcHeight = 0.06 + angle * 0.15; // Higher arc for longer angular distances

    const numPoints = 60;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;

      // Spherical linear interpolation (SLERP)
      let point: THREE.Vector3;
      if (angle < 0.001) {
        // Points are nearly identical, just lerp
        point = new THREE.Vector3().lerpVectors(start, end, t);
      } else {
        const sinAngle = Math.sin(angle);
        const a = Math.sin((1 - t) * angle) / sinAngle;
        const b = Math.sin(t * angle) / sinAngle;
        point = new THREE.Vector3(
          startNorm.x * a + endNorm.x * b,
          startNorm.y * a + endNorm.y * b,
          startNorm.z * a + endNorm.z * b
        );
      }

      // Add altitude for arc - bell curve highest in middle
      const altitudeFactor = Math.sin(t * Math.PI);
      const altitude = globeRadius + (arcHeight * altitudeFactor);

      point.normalize().multiplyScalar(altitude);
      points.push(point);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    return { curve, pathPoints: points };
  }, [from, to, globeRadius]);

  // Create sprite material with plane texture
  const spriteMaterial = useMemo(() => {
    const texture = getPlaneTexture();
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
  }, []);

  // Animate the plane along the path
  useFrame((state) => {
    const currentTime = state.clock.elapsedTime;

    // Check if it's time to depart (every 30 seconds after initial delay)
    const timeSinceStart = currentTime - initialDelay;
    if (timeSinceStart < 0) {
      setIsVisible(false);
      return;
    }

    const cycleTime = 30; // 30 seconds per departure
    const flightDuration = 12; // 12 seconds to complete one way
    const cyclePosition = timeSinceStart % cycleTime;

    if (cyclePosition < flightDuration) {
      // Outbound flight
      setIsVisible(true);
      setIsReturning(false);
      progressRef.current = cyclePosition / flightDuration;
    } else if (cyclePosition < flightDuration * 2) {
      // Return flight
      setIsVisible(true);
      setIsReturning(true);
      progressRef.current = (cyclePosition - flightDuration) / flightDuration;
    } else {
      // Waiting for next departure
      setIsVisible(false);
      progressRef.current = 0;
    }

    if (spriteRef.current && isVisible && curve) {
      // Get position on curve (reverse if returning)
      const t = isReturning ? 1 - progressRef.current : progressRef.current;
      const position = curve.getPoint(t);
      spriteRef.current.position.copy(position);

      // Get direction of travel for rotation
      const tangent = curve.getTangent(t);
      if (isReturning) tangent.negate();

      // Calculate the angle to rotate the sprite to point in direction of travel
      // Project tangent onto the camera's view plane
      const cameraPos = state.camera.position.clone();
      const cameraDir = cameraPos.sub(position).normalize();

      // Create camera-space coordinate system
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(worldUp, cameraDir).normalize();
      const up = new THREE.Vector3().crossVectors(cameraDir, right).normalize();

      // Get 2D angle of tangent in camera space
      const tangentX = tangent.dot(right);
      const tangentY = tangent.dot(up);

      // Calculate angle - plane texture points up (negative Y), so we adjust
      const angle = Math.atan2(tangentX, tangentY);

      // Apply rotation to sprite material
      spriteRef.current.material.rotation = -angle;

      // Set sprite scale
      spriteRef.current.scale.set(0.08, 0.08, 1);
    }
  });

  return (
    <group>
      {/* Flight path line */}
      <Line
        points={pathPoints}
        color={currentTheme.colors.flightPathColor}
        transparent
        opacity={0.3}
        lineWidth={1}
      />

      {/* Animated plane sprite */}

      {/* Particle trail for Celestial tier */}
      {currentTheme.features?.particleTrails && isVisible && (
        <FlightParticleTrail
          path={pathPoints}
          progress={isReturning ? 1 - progressRef.current : progressRef.current}
          color={currentTheme.colors.flightPathColor}
        />
      )}
      {isVisible && (
        <sprite ref={spriteRef} material={spriteMaterial} />
      )}
    </group>
  );
}

interface FlightPathsProps {
  globeRadius?: number;
}

export function FlightPaths({ globeRadius = 2 }: FlightPathsProps) {
  const myCities = useStore((state) => state.cities);
  const activeTagFilters = useStore((state) => state.activeTagFilters);

  // Check if viewing someone else's globe
  const viewingGlobe = useSocialStore((state) => state.viewingGlobe);

  // Convert PublicFlight[] to City[] format for flight paths
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

  // Generate flight paths from each city's origin to destination
  const flightPaths = useMemo(() => {
    // Filter cities based on active tag filters (only for own globe)
    const filteredCities = !viewingGlobe && activeTagFilters.length > 0
      ? cities.filter((city) =>
          activeTagFilters.some((tag) => city.tags.includes(tag))
        )
      : cities;

    return filteredCities
      .filter(city => city.coordinates.lat && city.coordinates.lng)
      .map((city, index) => {
        const from = city.flewFrom?.coordinates || DEFAULT_ORIGIN;
        const to = city.coordinates;
        return { from, to, index, id: city.id };
      });
  }, [cities, activeTagFilters, viewingGlobe]);

  if (flightPaths.length === 0) return null;

  return (
    <group>
      {flightPaths.map((path) => (
        <FlightPath
          key={path.id}
          from={path.from}
          to={path.to}
          globeRadius={globeRadius}
          index={path.index}
        />
      ))}
    </group>
  );
}
