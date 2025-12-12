import * as THREE from 'three';
import React from 'react';

export enum GameState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export enum ItemType {
  FOLIAGE = 'FOLIAGE',
  BAUBLE = 'BAUBLE',
  GARLAND = 'GARLAND',
  GIFT = 'GIFT',
  LIGHT = 'LIGHT',
  STAR_ORN = 'STAR_ORN'
}

export interface OrnamentData {
  id: number;
  type: ItemType;
  scatterPosition: THREE.Vector3;
  treePosition: THREE.Vector3;
  scale: THREE.Vector3; // Changed to Vector3 for non-uniform scaling (Gifts)
  color: THREE.Color;
  speed: number; 
  phase: number;
  rotationSpeed: THREE.Vector3;
}

export interface SnowConfig {
  enabled: boolean;
  count: number;
  speed: number;
}

export interface ShowcaseConfig {
  enabled: boolean;
  duration: number;
  triggerTimestamp: number; // Used to signal a new showcase start
}

export interface GameContextType {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  snowConfig: SnowConfig;
  setSnowConfig: (config: SnowConfig) => void;
  showcaseConfig: ShowcaseConfig;
  setShowcaseConfig: (config: ShowcaseConfig) => void;
  triggerShowcase: () => void;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
}