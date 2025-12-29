import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Globe } from './Globe';
import { useTheme } from '../hooks/useTheme';
import { ShootingStars } from './ShootingStars';
import { Suspense } from 'react';

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#0a0a12" wireframe />
    </mesh>
  );
}

export function Scene() {
  const { currentTheme } = useTheme();
  return (
    <div className="canvas-container" data-tour-target="globe">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />

        {/* Ambient lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.2} color={currentTheme.colors.accentLightColor} />

        {/* Star background */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={currentTheme.colors.starSaturation}
          fade
          speed={0.5}
        />

        {/* Additional star layer for depth */}
        <Stars
          radius={150}
          depth={60}
          count={2000}
          factor={6}
          saturation={currentTheme.colors.starSaturation * 1.5}
          fade
          speed={0.3}
        />

        {/* Shooting stars - one every 5 seconds */}
        <ShootingStars />

        {/* Globe */}
        <Suspense fallback={<LoadingFallback />}>
          <Globe />
        </Suspense>

        {/* Controls with momentum/inertia */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={12}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          enableDamping={true}
          dampingFactor={0.05}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
