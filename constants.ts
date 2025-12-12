import * as THREE from 'three';

export const COLORS = {
  emerald: new THREE.Color('#047857'),
  forest: new THREE.Color('#064e3b'),
  pine: new THREE.Color('#0f5132'),
  darkGreen: new THREE.Color('#022c22'),
  limeGreen: new THREE.Color('#3f6212'),
  
  // Luxury Metals
  gold: new THREE.Color('#FFD700'),
  roseGold: new THREE.Color('#e0bfb8'),
  silver: new THREE.Color('#e2e8f0'),
  bronze: new THREE.Color('#cd7f32'),
  
  // Accents
  red: new THREE.Color('#d00000'),
  crimson: new THREE.Color('#991b1b'),
  burgundy: new THREE.Color('#800020'),
  midnightBlue: new THREE.Color('#1e3a8a'),
  
  // Lights
  warmWhite: new THREE.Color('#fff7ed'),
};

// Luxury Wrapping Paper
export const WRAPPING_COLORS = [
  new THREE.Color('#022c22'), // Midnight Green
  new THREE.Color('#064e3b'), // Forest
  new THREE.Color('#78350f'), // Deep Bronze/Brown
  new THREE.Color('#450a0a'), // Deep Red
  new THREE.Color('#fcfbf7'), // Ivory/Cream
  new THREE.Color('#171717'), // Matte Black
];

export const COUNTS = {
  FOLIAGE: 3000,
  BAUBLES: 120,
  GARLAND: 350,
  GIFTS: 45, // Slightly more for a fuller pile
  LIGHTS: 400,
  STAR_ORNS: 60,
};

export const TREE_HEIGHT = 16;
export const TREE_RADIUS_BASE = 7;
export const SCATTER_RADIUS = 35;

export const MEDIAPIPE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";