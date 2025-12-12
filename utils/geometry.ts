import * as THREE from 'three';
import { OrnamentData, ItemType } from '../types';
import { COLORS, WRAPPING_COLORS, COUNTS, TREE_HEIGHT, TREE_RADIUS_BASE, SCATTER_RADIUS } from '../constants';

const randomPointInSphere = (r: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const rad = Math.cbrt(Math.random()) * r;
  return new THREE.Vector3(
    rad * Math.sin(phi) * Math.cos(theta),
    rad * Math.sin(phi) * Math.sin(theta),
    rad * Math.cos(phi)
  );
};

export const generateOrnaments = (): OrnamentData[] => {
  const items: OrnamentData[] = [];
  let idCounter = 0;

  // 1. GENERATE FOLIAGE
  const tiers = 10;
  for (let i = 0; i < COUNTS.FOLIAGE; i++) {
    const h = Math.random(); 
    const y = (h * TREE_HEIGHT) - (TREE_HEIGHT / 2);
    const baseRadius = TREE_RADIUS_BASE * (1 - h);
    const tierWobble = Math.pow(Math.sin(h * Math.PI * tiers), 2) * (1.5 * (1 - h));
    const maxRadiusAtHeight = Math.max(0.2, baseRadius + tierWobble);
    const r = Math.pow(Math.random(), 0.3) * maxRadiusAtHeight;
    const theta = Math.random() * Math.PI * 2;

    const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));

    const scaleBase = (0.2 + Math.random() * 0.3) * (1.2 - (h * 0.5));
    const scale = new THREE.Vector3(scaleBase, scaleBase, scaleBase);
    
    const colorMix = Math.random();
    let color: THREE.Color;
    if (colorMix > 0.7) color = COLORS.emerald;
    else if (colorMix > 0.4) color = COLORS.pine;
    else if (colorMix > 0.1) color = COLORS.forest;
    else color = COLORS.darkGreen;

    items.push({
      id: idCounter++,
      type: ItemType.FOLIAGE,
      scatterPosition: randomPointInSphere(SCATTER_RADIUS),
      treePosition: treePos,
      scale,
      color,
      speed: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      rotationSpeed: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.5),
    });
  }

  // 2. GENERATE GARLAND
  const turns = 6;
  for (let i = 0; i < COUNTS.GARLAND; i++) {
    const t = i / COUNTS.GARLAND;
    const h = t; 
    const y = (h * TREE_HEIGHT) - (TREE_HEIGHT / 2);
    const tierWobble = Math.pow(Math.sin(h * Math.PI * tiers), 2) * (1.5 * (1 - h));
    const r = (TREE_RADIUS_BASE * (1 - h)) + tierWobble + 0.2; 
    const angle = t * Math.PI * 2 * turns;
    
    const treePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);

    items.push({
      id: idCounter++,
      type: ItemType.GARLAND,
      scatterPosition: randomPointInSphere(SCATTER_RADIUS),
      treePosition: treePos,
      scale: new THREE.Vector3(0.1, 0.1, 0.1),
      color: COLORS.gold,
      speed: 0.5,
      phase: i * 0.1,
      rotationSpeed: new THREE.Vector3(0, 1, 0),
    });
  }

  // 3. GENERATE BAUBLES
  const baubleColors = [COLORS.red, COLORS.gold, COLORS.roseGold, COLORS.silver, COLORS.burgundy, COLORS.midnightBlue];
  for (let i = 0; i < COUNTS.BAUBLES; i++) {
    const h = Math.random() * 0.95;
    const y = (h * TREE_HEIGHT) - (TREE_HEIGHT / 2);
    const baseRadius = TREE_RADIUS_BASE * (1 - h);
    const tierWobble = Math.pow(Math.sin(h * Math.PI * tiers), 2) * (1.5 * (1 - h));
    const r = baseRadius + tierWobble + 0.15; // Slightly further out
    const theta = Math.random() * Math.PI * 2;

    const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
    const s = 0.3 + Math.random() * 0.2;

    items.push({
      id: idCounter++,
      type: ItemType.BAUBLE,
      scatterPosition: randomPointInSphere(SCATTER_RADIUS),
      treePosition: treePos,
      scale: new THREE.Vector3(s, s, s),
      color: baubleColors[Math.floor(Math.random() * baubleColors.length)],
      speed: 0.5 + Math.random(),
      phase: Math.random() * Math.PI * 2,
      rotationSpeed: new THREE.Vector3(0, 0, 0),
    });
  }

  // 4. GENERATE LIGHTS
  const lightTurns = 9;
  for (let i = 0; i < COUNTS.LIGHTS; i++) {
     const t = i / COUNTS.LIGHTS;
     const h = t; 
     const y = (h * TREE_HEIGHT) - (TREE_HEIGHT / 2);
     const tierWobble = Math.pow(Math.sin(h * Math.PI * tiers), 2) * (1.5 * (1 - h));
     const r = (TREE_RADIUS_BASE * (1 - h)) + tierWobble - 0.1; 
     const angle = -(t * Math.PI * 2 * lightTurns);
     const treePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
     
     items.push({
      id: idCounter++,
      type: ItemType.LIGHT,
      scatterPosition: randomPointInSphere(SCATTER_RADIUS),
      treePosition: treePos,
      scale: new THREE.Vector3(0.06, 0.06, 0.06), 
      color: COLORS.warmWhite,
      speed: 0.2,
      phase: i * 0.5,
      rotationSpeed: new THREE.Vector3(0,0,0)
     });
  }

  // 5. GENERATE GIFTS (Pile at base)
  for (let i = 0; i < COUNTS.GIFTS; i++) {
      // Create a visually pleasing pile
      // Inner circle, middle circle, outer circle logic for density
      const t = i / COUNTS.GIFTS;
      let rOffset = 2.0;
      if (t > 0.3) rOffset = 4.0;
      if (t > 0.7) rOffset = 6.0;

      const angle = (i * 1.618 * Math.PI * 2) + Math.random() * 0.5; // Golden ratio distribution
      const radius = rOffset + Math.random() * 1.5;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const floorY = -(TREE_HEIGHT / 2);
      
      // Keep scales relatively cubic to prevent ribbon stretching distortion
      const sizeBase = 0.8 + Math.random() * 0.6;
      const sx = sizeBase * (0.9 + Math.random() * 0.2);
      const sy = sizeBase * (0.8 + Math.random() * 0.4);
      const sz = sizeBase * (0.9 + Math.random() * 0.2);
      
      const treePos = new THREE.Vector3(x, floorY + sy/2, z);

      items.push({
        id: idCounter++,
        type: ItemType.GIFT,
        scatterPosition: randomPointInSphere(SCATTER_RADIUS),
        treePosition: treePos,
        scale: new THREE.Vector3(sx, sy, sz),
        color: WRAPPING_COLORS[Math.floor(Math.random() * WRAPPING_COLORS.length)],
        speed: 0.1,
        phase: Math.random(),
        rotationSpeed: new THREE.Vector3(0, Math.random() * Math.PI * 2, 0) // Y rotation for placement
      });
  }

  // 6. GENERATE STAR ORNAMENTS
  for (let i = 0; i < COUNTS.STAR_ORNS; i++) {
     const h = Math.random() * 0.8; 
     const y = (h * TREE_HEIGHT) - (TREE_HEIGHT / 2);
     const baseRadius = TREE_RADIUS_BASE * (1 - h);
     const r = baseRadius + Math.random() * 1.0; 
     const theta = Math.random() * Math.PI * 2;
     
     const treePos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
     const s = 0.2 + Math.random() * 0.15;

     items.push({
         id: idCounter++,
         type: ItemType.STAR_ORN,
         scatterPosition: randomPointInSphere(SCATTER_RADIUS),
         treePosition: treePos,
         scale: new THREE.Vector3(s, s, s),
         color: Math.random() > 0.5 ? COLORS.gold : COLORS.silver,
         speed: 0.3,
         phase: Math.random() * 10,
         rotationSpeed: new THREE.Vector3(Math.random(), Math.random(), 0)
     });
  }

  return items;
};