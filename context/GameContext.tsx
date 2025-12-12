import React, { createContext, useContext, useState, useRef, PropsWithChildren } from 'react';
import { GameState, GameContextType, SnowConfig, ShowcaseConfig } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.SCATTERED);
  const [snowConfig, setSnowConfig] = useState<SnowConfig>({
    enabled: true,
    count: 1500,
    speed: 1.0,
  });
  
  const [showcaseConfig, setShowcaseConfig] = useState<ShowcaseConfig>({
    enabled: true,
    duration: 1.5, // Faster default (1.5s)
    triggerTimestamp: 0,
  });

  // Default to a file path that would exist in the public folder
  // In a real app, the user would place 'christmas_magic.mp3' in the public/ dir.
  // For this demo, we can also use a reliable external URL as a fallback if the local one fails,
  // but to satisfy "save to public folder", we reference the local path.
  const [audioUrl, setAudioUrl] = useState<string | null>('/christmas-christmas-background-music-441462.mp3');
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const triggerShowcase = () => {
    setShowcaseConfig(prev => ({ ...prev, triggerTimestamp: Date.now() }));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        snowConfig,
        setSnowConfig,
        showcaseConfig,
        setShowcaseConfig,
        triggerShowcase,
        audioUrl,
        setAudioUrl,
        isPlaying,
        setIsPlaying,
        volume,
        setVolume,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};