import { memo, useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { GameState, ItemType } from '../types';
import { generateOrnaments } from '../utils/geometry';

// Realistic Ribbon Geometry: Flat crossed ribbons with bow loops and tails
const createRibbonGeometry = () => {
  const geometries: THREE.BufferGeometry[] = [];

  // Cross ribbons - flat bands that wrap around the box
  // Ribbon 1: Wraps around X axis (front to back over top)
  const ribbon1 = new THREE.BoxGeometry(1.04, 0.12, 0.04);
  ribbon1.translate(0, 0.52, 0); // Top face
  geometries.push(ribbon1);

  const ribbon1Front = new THREE.BoxGeometry(0.12, 1.04, 0.04);
  ribbon1Front.translate(0, 0, 0.52); // Front face
  geometries.push(ribbon1Front);

  const ribbon1Back = new THREE.BoxGeometry(0.12, 1.04, 0.04);
  ribbon1Back.translate(0, 0, -0.52); // Back face
  geometries.push(ribbon1Back);

  // Ribbon 2: Wraps around Z axis (left to right over top)
  const ribbon2 = new THREE.BoxGeometry(0.04, 0.12, 1.04);
  ribbon2.translate(0, 0.52, 0); // Top face (perpendicular)
  geometries.push(ribbon2);

  const ribbon2Left = new THREE.BoxGeometry(0.04, 1.04, 0.12);
  ribbon2Left.translate(-0.52, 0, 0); // Left face
  geometries.push(ribbon2Left);

  const ribbon2Right = new THREE.BoxGeometry(0.04, 1.04, 0.12);
  ribbon2Right.translate(0.52, 0, 0); // Right face
  geometries.push(ribbon2Right);

  // Bow center knot
  const knotGeo = new THREE.SphereGeometry(0.12, 12, 12);
  knotGeo.scale(1, 0.7, 1);
  knotGeo.translate(0, 0.58, 0);
  geometries.push(knotGeo);

  // Bow loops - two torus arcs for the loops
  const loopLeft = new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI);
  loopLeft.rotateZ(Math.PI / 2);
  loopLeft.rotateY(Math.PI / 4);
  loopLeft.translate(-0.15, 0.7, 0);
  geometries.push(loopLeft);

  const loopRight = new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI);
  loopRight.rotateZ(-Math.PI / 2);
  loopRight.rotateY(-Math.PI / 4);
  loopRight.translate(0.15, 0.7, 0);
  geometries.push(loopRight);

  // Bow tails - curved ribbons hanging down
  const tailLeft = new THREE.BoxGeometry(0.08, 0.25, 0.02);
  tailLeft.rotateZ(0.4);
  tailLeft.translate(-0.2, 0.48, 0);
  geometries.push(tailLeft);

  const tailRight = new THREE.BoxGeometry(0.08, 0.25, 0.02);
  tailRight.rotateZ(-0.4);
  tailRight.translate(0.2, 0.48, 0);
  geometries.push(tailRight);

  // Merge all geometries
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

  const targetGeo = new THREE.BufferGeometry();
  targetGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  targetGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

  // Dispose intermediate geometries to free memory
  geometries.forEach(g => g.dispose());

  return targetGeo;
};

export const Ornaments = memo(() => {
  const { gameState, isIndexUp } = useGame();

  const groupRef = useRef<THREE.Group>(null);

  // Stable spin speed (radians per second)
  const SPIN_SPEED = 1.5;

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
        if (isIndexUp && isTree) {
          // INDEX UP: Continuous stable spin
          groupRef.current.rotation.y += delta * SPIN_SPEED;
        } else if (!isTree) {
          // SCATTERED: Slow drift
          groupRef.current.rotation.y += delta * 0.1;
        }
        // TREE without index: No spin (stationary)
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

      {/* 4. GIFTS - Shiny wrapping paper look */}
      <instancedMesh ref={giftRef} args={[undefined, undefined, giftIndices.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          roughness={0.3}
          metalness={0.0}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          sheen={1.0}
          sheenRoughness={0.3}
          sheenColor="#ffffff"
        />
      </instancedMesh>

      {/* 4b. GIFT RIBBONS - Satin ribbon look */}
      <instancedMesh ref={giftRibbonRef} args={[ribbonGeometry, undefined, giftIndices.length]} castShadow>
        <meshPhysicalMaterial
          color="#dc2626"
          roughness={0.35}
          metalness={0.0}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          sheen={2.0}
          sheenRoughness={0.25}
          sheenColor="#ff6b6b"
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
});