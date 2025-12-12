import { memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Ornaments } from './Ornaments';
import { SnowSystem } from './SnowSystem';
import { Star } from './Star';

const Lights = memo(() => (
  <>
    <ambientLight intensity={0.1} />
    <spotLight position={[15, 25, 10]} angle={0.5} penumbra={1} intensity={2.5} castShadow color="#fffbeb" />
    <pointLight position={[-15, 10, -15]} intensity={1.5} color="#10b981" />
    <pointLight position={[0, -5, 10]} intensity={0.5} color="#fbbf24" />
  </>
));

const BackgroundColor = memo(() => <color attach="background" args={['#020617']} />);

export const Scene = memo(() => {
  return (
    <div className="w-full h-screen relative">
      <Canvas shadows dpr={[1, 2]}>
        <BackgroundColor />
        <PerspectiveCamera makeDefault position={[0, 2, 32]} fov={50} />
        
        <Lights />
        
        <group position={[0, -2, 0]}>
            <Ornaments />
            <Star />
        </group>
        
        <SnowSystem />
        
        {/* Post Processing */}
        <EffectComposer disableNormalPass>
          {/* Increased bloom for string lights */}
          <Bloom luminanceThreshold={0.8} mipmapBlur intensity={2.0} radius={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={0.6} />
        </EffectComposer>

        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={15} 
            maxDistance={50} 
            autoRotate={false} 
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* Environment for shiny baubles */}
        <Environment preset="night" />
      </Canvas>
    </div>
  );
});