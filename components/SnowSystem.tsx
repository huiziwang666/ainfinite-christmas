import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';

// Procedurally generate a snowflake texture
function createSnowflakeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, 32, 32);
    
    // Draw Snowflake Symbol
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('❄', 16, 18);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const SnowSystem: React.FC = () => {
  const { snowConfig } = useGame();
  const pointsRef = useRef<THREE.Points>(null);
  
  const snowflakeTexture = useMemo(() => createSnowflakeTexture(), []);
  
  // Generate particles with separate state for deterministic animation
  const particles = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    
    // Persistent state for animation
    const initialXZ = new Float32Array(count * 2); // Anchor X, Z
    const yCoords = new Float32Array(count);       // Precise Y position
    const params = new Float32Array(count * 4);    // speed, freq, amp, phase
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 40 - 10;
      const z = (Math.random() - 0.5) * 60;
      
      // Initialize geometry
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Store state
      initialXZ[i * 2] = x;
      initialXZ[i * 2 + 1] = z;
      yCoords[i] = y;
      
      // Animation parameters
      // Fall speed: 2.0 to 5.0 units/sec (Dominant motion)
      params[i * 4] = 2.0 + Math.random() * 3.0; 
      // Oscillation frequency
      params[i * 4 + 1] = 0.5 + Math.random() * 1.5; 
      // Oscillation amplitude (drift): 0.1 to 0.25 units (Very small!)
      params[i * 4 + 2] = 0.1 + Math.random() * 0.15; 
      // Phase
      params[i * 4 + 3] = Math.random() * Math.PI * 2;
    }
    
    return { count, positions, initialXZ, yCoords, params };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !snowConfig.enabled) return;
    
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const positions = posAttr.array as Float32Array; // Live buffer
    
    const dt = Math.min(delta, 1 / 30); // Clamp delta to prevent jumps
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particles.count; i++) {
      const idx3 = i * 3;
      const idx2 = i * 2;
      const idx4 = i * 4;
      
      const speed = particles.params[idx4];
      const freq = particles.params[idx4 + 1];
      const amp = particles.params[idx4 + 2];
      const phase = particles.params[idx4 + 3];
      
      // 1. Vertical Motion (Dominant)
      // Integrate only Y. 
      // Multiplied by global speed config.
      particles.yCoords[i] -= speed * snowConfig.speed * dt;
      
      // Wrap around logic
      if (particles.yCoords[i] < -15) {
        particles.yCoords[i] = 25; // Reset to top
        // Pick new random X/Z anchor to vary patterns
        particles.initialXZ[idx2] = (Math.random() - 0.5) * 60;
        particles.initialXZ[idx2 + 1] = (Math.random() - 0.5) * 60;
      }
      
      // 2. Horizontal Oscillation (Bounded)
      // x = x0 + sin(t) * amp
      // This prevents any accumulated drift error.
      const wobbleX = Math.sin(time * freq + phase) * amp;
      const wobbleZ = Math.cos(time * freq + phase) * amp; 
      
      // Update geometry buffer directly
      positions[idx3] = particles.initialXZ[idx2] + wobbleX;
      positions[idx3 + 1] = particles.yCoords[i];
      positions[idx3 + 2] = particles.initialXZ[idx2 + 1] + wobbleZ;
    }
    
    posAttr.needsUpdate = true;
    
    // Minimal rotation for depth perception, slow enough to avoid drift illusion
    pointsRef.current.rotation.y = time * 0.015;
  });

  if (!snowConfig.enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={snowflakeTexture}
        size={0.4} 
        color="#fff"
        transparent
        opacity={0.8}
        alphaTest={0.01}
        depthWrite={false}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};