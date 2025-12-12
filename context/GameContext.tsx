import { createContext, useContext, useState, useMemo, useCallback, PropsWithChildren } from 'react';
import { GameState, GameContextType, SnowConfig, ShowcaseConfig } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: PropsWithChildren) => {
  const [gameState, setGameState] = useState<GameState>(GameState.SCATTERED);
  const [snowConfig, setSnowConfig] = useState<SnowConfig>({
    enabled: true,
    count: 1500,
    speed: 1.0,
  });

  const [showcaseConfig, setShowcaseConfig] = useState<ShowcaseConfig>({
    enabled: true,
    duration: 1.5,
    triggerTimestamp: 0,
  });

  const [audioUrl, setAudioUrl] = useState<string | null>('/christmas-christmas-background-music-441462.mp3');
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isIndexUp, setIsIndexUp] = useState(false);

  const triggerShowcase = useCallback(() => {
    setShowcaseConfig(prev => ({ ...prev, triggerTimestamp: Date.now() }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<GameContextType>(() => ({
    gameState,
    setGameState,
    snowConfig,
    setSnowConfig,
    showcaseConfig,
    setShowcaseConfig,
    triggerShowcase,
    isIndexUp,
    setIsIndexUp,
    audioUrl,
    setAudioUrl,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
  }), [gameState, snowConfig, showcaseConfig, triggerShowcase, isIndexUp, audioUrl, isPlaying, volume]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};