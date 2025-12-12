import { memo, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { GameState } from '../types';
import { TREE_HEIGHT } from '../constants';

export const Star = memo(() => {
  const { gameState } = useGame();
  const groupRef = useRef<THREE.Group>(null);

  // Memoize positions to avoid recreation every render
  const treePos = useMemo(() => new THREE.Vector3(0, (TREE_HEIGHT / 2) + 0.8, 0), []);
  const scatterPos = useMemo(() => new THREE.Vector3(0, 10, 0), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const isTree = gameState === GameState.TREE_SHAPE;
    const target = isTree ? treePos : scatterPos;
    
    // Move
    groupRef.current.position.lerp(target, delta * 2.5);
    
    // Rotate
    groupRef.current.rotation.y += delta * 1.0;
    
    // Pulse
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    const baseScale = isTree ? 1.2 : 0.6;
    tempScale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
    groupRef.current.scale.lerp(tempScale, delta * 5);
  });

  // Construct a more star-like shape using two tetrahedrons or octahedrons
  return (
    <group ref={groupRef}>
      {/* Core Glow */}
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24" 
          emissiveIntensity={4} 
          toneMapped={false}
        />
      </mesh>
      
      {/* Spikes */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
         <octahedronGeometry args={[0.8, 0]} />
         <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24" 
          emissiveIntensity={2} 
        />
      </mesh>

      <pointLight distance={15} intensity={3} color="#fbbf24" decay={2} />
    </group>
  );
});