import React, { useMemo, useRef, useLayoutEffect, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { GameState, ItemType } from '../types';
import { generateOrnaments } from '../utils/geometry';

// Easing function: easeInOutCubic
const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// Better Ribbon Geometry: Cross Wrap + Large Bow
const createRibbonGeometry = () => {
  // Band 1: Vertical loop around X axis (wraps top/bottom)
  // Box is 1x1x1 centered at 0.
  const band1Geo = new THREE.BoxGeometry(1.02, 1.02, 0.15);
  // Band 2: Vertical loop around Z axis (wraps top/bottom)
  const band2Geo = new THREE.BoxGeometry(0.15, 1.02, 1.02);

  // Bow: Large loops on top
  const bowGeo = new THREE.TorusKnotGeometry(0.3, 0.08, 64, 8, 2, 3);
  bowGeo.rotateX(Math.PI / 2);
  bowGeo.translate(0, 0.65, 0); // Sit on top

  const targetGeo = new THREE.BufferGeometry();
  const geometries = [band1Geo, band2Geo, bowGeo];
  let totalVerts = 0;
  geometries.forEach(g => totalVerts += g.attributes.position.count);

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  
  let offset = 0;
  geometries.forEach(g => {
    const p = g.attributes.position.array;
    const n = g.attributes.normal.array;
    positions.set(p, offset * 3);
    normals.set(n, offset * 3);
    offset += g.attributes.position.count;
  });

  targetGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  targetGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return targetGeo;
};

export const Ornaments: React.FC = () => {
  const { gameState, showcaseConfig } = useGame();
  
  const groupRef = useRef<THREE.Group>(null);

  // Showcase state refs (animation controller)
  const isShowcasing = useRef(false);
  const showcaseStartRotation = useRef(0);
  const showcaseStartTime = useRef(0);

  // Watch for trigger timestamp updates
  useEffect(() => {
    if (showcaseConfig.triggerTimestamp > 0 && groupRef.current) {
      isShowcasing.current = true;
      showcaseStartRotation.current = groupRef.current.rotation.y;
      showcaseStartTime.current = performance.now(); // High precision time
    }
  }, [showcaseConfig.triggerTimestamp]);

  // Cancel showcase if user scatters
  useEffect(() => {
    if (gameState === GameState.SCATTERED) {
      isShowcasing.current = false;
    }
  }, [gameState]);

  // Refs for Instances
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const baubleRef = useRef<THREE.InstancedMesh>(null);
  const garlandRef = useRef<THREE.InstancedMesh>(null);
  const giftRef = useRef<THREE.InstancedMesh>(null);
  const giftRibbonRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const starOrnRef = useRef<THREE.InstancedMesh>(null);
  
  const data = useMemo(() => generateOrnaments(), []);
  
  // Indices
  const { foliageIndices, baubleIndices, garlandIndices, giftIndices, lightIndices, starOrnIndices } = useMemo(() => {
    const f: number[] = [];
    const b: number[] = [];
    const g: number[] = [];
    const gift: number[] = [];
    const l: number[] = [];
    const s: number[] = [];
    
    data.forEach((item, index) => {
      switch (item.type) {
        case ItemType.FOLIAGE: f.push(index); break;
        case ItemType.BAUBLE: b.push(index); break;
        case ItemType.GARLAND: g.push(index); break;
        case ItemType.GIFT: gift.push(index); break;
        case ItemType.LIGHT: l.push(index); break;
        case ItemType.STAR_ORN: s.push(index); break;
      }
    });
    return { 
        foliageIndices: f, baubleIndices: b, garlandIndices: g, 
        giftIndices: gift, lightIndices: l, starOrnIndices: s 
    };
  }, [data]);

  // Geometry & Objects
  const ribbonGeometry = useMemo(() => createRibbonGeometry(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // Init Colors
  useLayoutEffect(() => {
    const initColor = (ref: React.RefObject<THREE.InstancedMesh | null>, indices: number[]) => {
      if (!ref.current) return;
      let localIndex = 0;
      indices.forEach((dataIndex) => {
        color.set(data[dataIndex].color);
        ref.current!.setColorAt(localIndex++, color);
      });
      ref.current!.instanceColor!.needsUpdate = true;
    };
    initColor(foliageRef, foliageIndices);
    initColor(baubleRef, baubleIndices);
    initColor(garlandRef, garlandIndices);
    initColor(giftRef, giftIndices);
    initColor(lightRef, lightIndices);
    initColor(starOrnRef, starOrnIndices);
  }, [data]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const isTree = gameState === GameState.TREE_SHAPE;
    
    // --- ROTATION LOGIC ---
    if (groupRef.current) {
        if (isShowcasing.current) {
          // SHOWCASE MODE (Index Show)
          const now = performance.now();
          const elapsed = (now - showcaseStartTime.current) / 1000;
          const progress = Math.min(elapsed / showcaseConfig.duration, 1.0);
          
          const eased = easeInOutCubic(progress);
          groupRef.current.rotation.y = showcaseStartRotation.current + (eased * Math.PI * 2);
          
          if (progress >= 1.0) {
            isShowcasing.current = false;
            // Ensure exact rotation finish
            groupRef.current.rotation.y = showcaseStartRotation.current + Math.PI * 2;
            groupRef.current.rotation.y %= (Math.PI * 2);
          }
        } else {
          // NORMAL MODE
          // If Scattered: Drift slowly.
          // If Tree (Fist): STOP spin.
          if (!isTree) {
             groupRef.current.rotation.y += delta * 0.1; // Slow drift when scattered
          } else {
             // Tree mode: No spin unless showcased
             // We can optionally interpolate to a stop if we wanted smooth stop, 
             // but instantaneous stop is more responsive to "Tree should not spin".
          }
        }
    }

    // --- INSTANCE UPDATES ---
    const updateMesh = (
      ref: React.RefObject<THREE.InstancedMesh | null>, 
      indices: number[], 
      geometryType: ItemType,
      secondaryRef?: React.RefObject<THREE.InstancedMesh | null>
    ) => {
      if (!ref.current) return;
      let localIndex = 0;
      indices.forEach((dataIndex) => {
        const item = data[dataIndex];
        
        // 1. Position Logic
        const targetPos = isTree ? item.treePosition : item.scatterPosition;
        const noiseAmp = isTree ? 0.05 : 0.5;
        const noiseY = Math.sin(t * item.speed + item.phase) * noiseAmp;
        
        tempVec.copy(targetPos);
        tempVec.y += noiseY;

        if (!isTree) {
           tempVec.x += Math.sin(t * 0.2 + item.phase) * 1.5;
           tempVec.z += Math.cos(t * 0.2 + item.phase) * 1.5;
        }

        // Interpolation
        ref.current!.getMatrixAt(localIndex, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        const lerpSpeed = isTree ? 3.0 : 1.5;
        dummy.position.lerp(tempVec, delta * lerpSpeed);
        
        // 2. Rotation
        if (geometryType === ItemType.FOLIAGE) {
             if (isTree) {
                dummy.lookAt(0, dummy.position.y, 0); 
                dummy.lookAt(dummy.position.x * 2, dummy.position.y, dummy.position.z * 2);
                dummy.rotateX(Math.PI / 2 - 0.4); 
             } else {
                 dummy.rotation.set(t * item.rotationSpeed.x, t * item.rotationSpeed.y, t * item.rotationSpeed.z);
             }
        } else if (geometryType === ItemType.GIFT) {
             if (isTree) {
                 const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, item.rotationSpeed.y, 0));
                 dummy.quaternion.slerp(targetQ, delta * 2);
             } else {
                 dummy.rotation.x += delta * item.rotationSpeed.x;
                 dummy.rotation.y += delta * item.rotationSpeed.y;
             }
        } else if (geometryType === ItemType.STAR_ORN) {
            dummy.rotation.set(t * item.speed, t * item.speed, 0);
        } else {
            dummy.rotation.x += delta * item.rotationSpeed.x;
            dummy.rotation.y += delta * item.rotationSpeed.y;
            dummy.rotation.z += delta * item.rotationSpeed.z;
        }

        // 3. Scale
        dummy.scale.lerp(item.scale, delta * 5);

        // Commit
        dummy.updateMatrix();
        ref.current!.setMatrixAt(localIndex, dummy.matrix);
        if (secondaryRef && secondaryRef.current) {
             secondaryRef.current.setMatrixAt(localIndex, dummy.matrix);
        }

        localIndex++;
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (secondaryRef && secondaryRef.current) secondaryRef.current.instanceMatrix.needsUpdate = true;
    };

    updateMesh(foliageRef, foliageIndices, ItemType.FOLIAGE);
    updateMesh(baubleRef, baubleIndices, ItemType.BAUBLE);
    updateMesh(garlandRef, garlandIndices, ItemType.GARLAND);
    updateMesh(giftRef, giftIndices, ItemType.GIFT, giftRibbonRef);
    updateMesh(lightRef, lightIndices, ItemType.LIGHT);
    updateMesh(starOrnRef, starOrnIndices, ItemType.STAR_ORN);
  });

  return (
    <group ref={groupRef}>
      {/* 1. FOLIAGE */}
      <instancedMesh ref={foliageRef} args={[undefined, undefined, foliageIndices.length]} castShadow receiveShadow>
        <coneGeometry args={[0.4, 1.2, 5, 1]} /> 
        <meshStandardMaterial roughness={0.7} metalness={0.1} flatShading={true} />
      </instancedMesh>

      {/* 2. BAUBLES */}
      <instancedMesh ref={baubleRef} args={[undefined, undefined, baubleIndices.length]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial roughness={0.15} metalness={0.9} clearcoat={1.0} clearcoatRoughness={0.1} envMapIntensity={2.0} />
      </instancedMesh>

      {/* 3. GARLAND */}
      <instancedMesh ref={garlandRef} args={[undefined, undefined, garlandIndices.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>

      {/* 4. GIFTS */}
      <instancedMesh ref={giftRef} args={[undefined, undefined, giftIndices.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.1} />
      </instancedMesh>
      
      {/* 4b. GIFT RIBBONS */}
      <instancedMesh ref={giftRibbonRef} args={[ribbonGeometry, undefined, giftIndices.length]} castShadow>
         <meshPhysicalMaterial 
            color="#FFD700" 
            roughness={0.2} 
            metalness={1.0} 
            clearcoat={0.5}
            emissive="#FFD700"
            emissiveIntensity={0.2}
         />
      </instancedMesh>

      {/* 5. LIGHTS */}
      <instancedMesh ref={lightRef} args={[undefined, undefined, lightIndices.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#fff7ed" emissive="#fff7ed" emissiveIntensity={5} toneMapped={false} />
      </instancedMesh>

      {/* 6. STAR ORNAMENTS */}
      <instancedMesh ref={starOrnRef} args={[undefined, undefined, starOrnIndices.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial roughness={0.1} metalness={1.0} clearcoat={1.0} envMapIntensity={3.0} />
      </instancedMesh>
    </group>
  );
};