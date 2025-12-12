import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { GameState } from '../types';
import { Music, Volume2, Snowflake, Sparkles, MoveHorizontal, RotateCw } from 'lucide-react';

export const UI: React.FC = () => {
  const { 
    gameState, setGameState, 
    snowConfig, setSnowConfig,
    showcaseConfig, setShowcaseConfig,
    audioUrl, setAudioUrl,
    isPlaying, setIsPlaying,
    volume, setVolume
  } = useGame();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-play effect
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl && isPlaying) {
      audio.src = audioUrl;
      audio.volume = volume;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented by browser. User interaction required.");
          setIsPlaying(false); // Update state to reflect reality
        });
      }
    }
  }, [audioUrl]); // Only run when URL changes (or on mount)

  // Watch isPlaying state changes
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      
      if (isPlaying && audio.paused) {
          audio.play().catch(() => setIsPlaying(false));
      } else if (!isPlaying && !audio.paused) {
          audio.pause();
      }
  }, [isPlaying]);

  const toggleState = () => {
    setGameState(gameState === GameState.SCATTERED ? GameState.TREE_SHAPE : GameState.SCATTERED);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setIsPlaying(true);
    }
  };

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <>
      <audio ref={audioRef} loop />
      
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-40">
        <div>
          <h1 className="text-4xl text-white font-serif tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            AInfinite <span className="text-emerald-400">Christmas</span>
          </h1>
          <p className="text-white/60 text-sm mt-1">Cast your spell to build the tree</p>
        </div>

        <div className="flex flex-col gap-4 pointer-events-auto items-end">
          {/* Main Action Button */}
          <button 
            onClick={toggleState}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-500
              ${gameState === GameState.TREE_SHAPE 
                ? 'bg-emerald-600 shadow-[0_0_30px_rgba(5,150,105,0.6)] text-white hover:bg-emerald-500' 
                : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
              }
            `}
          >
            <Sparkles className={`w-5 h-5 ${gameState === GameState.TREE_SHAPE ? 'animate-spin-slow' : ''}`} />
            {gameState === GameState.TREE_SHAPE ? 'Release Magic' : 'Cast Spell'}
          </button>

          {/* Controls Container */}
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-4 w-64 max-h-[80vh] overflow-y-auto">
            
            {/* Snow Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Snowflake className="w-4 h-4" /> Snow
              </div>
              <input 
                type="range" min="0" max="2" step="0.1" 
                value={snowConfig.speed}
                onChange={(e) => setSnowConfig({...snowConfig, speed: parseFloat(e.target.value)})}
                className="w-24 accent-emerald-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Showcase Control (Index Up) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <RotateCw className="w-4 h-4" /> Showcase (Index Up)
                    </div>
                    <button 
                        onClick={() => setShowcaseConfig({...showcaseConfig, enabled: !showcaseConfig.enabled})}
                        className={`w-8 h-4 rounded-full transition-colors relative ${showcaseConfig.enabled ? 'bg-emerald-500' : 'bg-white/20'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showcaseConfig.enabled ? 'translate-x-4' : ''}`} />
                    </button>
                </div>
                {showcaseConfig.enabled && (
                    <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Duration</span>
                        <input 
                            type="range" min="0.5" max="8" step="0.5" 
                            value={showcaseConfig.duration}
                            onChange={(e) => setShowcaseConfig({...showcaseConfig, duration: parseFloat(e.target.value)})}
                            className="w-32 accent-emerald-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-6 text-right">{showcaseConfig.duration}s</span>
                    </div>
                )}
            </div>

            {/* Music Control */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Music className="w-4 h-4" /> Music
                </div>
                {audioUrl ? (
                   <button onClick={toggleMusic} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition">
                     {isPlaying ? 'Pause' : 'Play'}
                   </button>
                ) : (
                   <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-emerald-600/50 hover:bg-emerald-600 px-2 py-1 rounded text-white transition">
                     Upload MP3
                   </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
              </div>
              
              {audioUrl && (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-white/50" />
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={handleVolume}
                    className="w-full accent-emerald-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};