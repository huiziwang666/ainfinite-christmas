import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { useGame } from '../context/GameContext';
import { GameState } from '../types';
import { MEDIAPIPE_MODEL_URL } from '../constants';
import { Loader2, Camera, Eye, EyeOff } from 'lucide-react';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index
  [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
  [5, 9], [9, 13], [13, 17], [0, 17]        // Palm
];

// Heuristic: Check if index is up and others are folded
// landmarks: Array of {x, y, z}
const isIndexFingerUp = (landmarks: any[]) => {
  // Finger Indices:
  // Thumb: 1-4, Index: 5-8, Middle: 9-12, Ring: 13-16, Pinky: 17-20
  // Y increases downwards (0 is top, 1 is bottom)

  const indexTip = landmarks[8];
  const indexPip = landmarks[6]; // Use PIP for strictness
  
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];

  const ringTip = landmarks[16];
  const ringPip = landmarks[14];

  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  // 1. Index finger extended? Tip above PIP.
  // Relaxed threshold: just check if tip is higher (y is smaller) than PIP
  const indexExtended = indexTip.y < indexPip.y; 

  // 2. Other fingers folded? Tips below their PIPs (y is larger)
  const middleFolded = middleTip.y > middlePip.y;
  const ringFolded = ringTip.y > ringPip.y;
  const pinkyFolded = pinkyTip.y > pinkyPip.y;

  return indexExtended && middleFolded && ringFolded && pinkyFolded;
};

export const HandTracker: React.FC = () => {
  const { setGameState, gameState, showcaseConfig, triggerShowcase } = useGame();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [currentGesture, setCurrentGesture] = useState<string>('None');
  
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>();
  
  // Debounce logic
  const lastGestureRef = useRef<string>('None');
  const gestureFrameCount = useRef<number>(0);
  const CONFIDENCE_THRESHOLD = 5;

  // Showcase Debounce
  const lastShowcaseTime = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MEDIAPIPE_MODEL_URL,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        recognizerRef.current = recognizer;
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load MediaPipe", err);
        setError("Gesture controls unavailable");
      }
    };
    init();

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const enableCam = async () => {
    if (!recognizerRef.current || !videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 30 } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
      setCameraActive(true);
    } catch (err) {
      setError("Camera access denied");
    }
  };

  const drawSkeleton = (result: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video display size
    if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];

        // Drawing Settings
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Draw Connections (Bones)
        ctx.strokeStyle = '#34d399'; // Emerald-400 Neon
        
        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
            const start = landmarks[startIdx];
            const end = landmarks[endIdx];

            // Mirror coordinates: x = 1 - x
            const x1 = (1 - start.x) * canvas.width;
            const y1 = start.y * canvas.height;
            const x2 = (1 - end.x) * canvas.width;
            const y2 = end.y * canvas.height;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // 2. Draw Landmarks (Joints)
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const x = (1 - lm.x) * canvas.width;
            const y = lm.y * canvas.height;

            ctx.beginPath();
            // Fingertips (4, 8, 12, 16, 20) get larger dots
            const isTip = i % 4 === 0 && i !== 0;
            const radius = isTip ? 4 : 2;
            
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = isTip ? '#fbbf24' : '#ffffff'; // Gold or White
            ctx.fill();
        }
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;
    
    if (video && recognizer) {
      const nowInMs = Date.now();
      if (video.currentTime !== video.duration && !video.paused && !video.ended) {
         let results: GestureRecognizerResult | undefined;
         try {
             results = recognizer.recognizeForVideo(video, nowInMs);
         } catch (e) {
             console.error(e);
         }

         if (results) {
             if (showDebug) drawSkeleton(results);
             else {
                 const ctx = canvasRef.current?.getContext('2d');
                 if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
             }

             if (results.gestures.length > 0 && results.landmarks.length > 0) {
               // Get MP category
               let detectedGesture = results.gestures[0][0].categoryName;
               const score = results.gestures[0][0].score;
               const landmarks = results.landmarks[0];
               
               // Override with heuristic for precise Index Up
               if (isIndexFingerUp(landmarks)) {
                 detectedGesture = 'Index_Up';
               }

               if (score > 0.5) {
                   // Debounce
                   if (detectedGesture === lastGestureRef.current) {
                     gestureFrameCount.current++;
                   } else {
                     gestureFrameCount.current = 0;
                     lastGestureRef.current = detectedGesture;
                   }

                   if (gestureFrameCount.current > CONFIDENCE_THRESHOLD) {
                     setCurrentGesture(detectedGesture);
                     
                     // --- STATE TRANSITIONS ---
                     if (detectedGesture === 'Open_Palm') {
                        setGameState(GameState.SCATTERED);
                     } else if (detectedGesture === 'Closed_Fist') {
                        setGameState(GameState.TREE_SHAPE);
                     }
                     
                     // --- SHOWCASE TRIGGER ---
                     // Check for Tree Shape OR let Index Up force the tree state? 
                     // For now, keep requirement that we must be in Tree Shape to spin.
                     if (detectedGesture === 'Index_Up' && gameState === GameState.TREE_SHAPE && showcaseConfig.enabled) {
                         const now = Date.now();
                         // Reduce cooldown to 1s to allow continuous-like spinning if held
                         // The animation is ~1.5s, so overlapping triggers will restart it, creating a continuous effect.
                         if (now - lastShowcaseTime.current > 1000) { 
                             triggerShowcase();
                             lastShowcaseTime.current = now;
                         }
                     }
                   }
               }
             } else {
                 // No hand
                 if (gestureFrameCount.current > 0) gestureFrameCount.current = 0;
                 lastGestureRef.current = 'None';
                 setCurrentGesture('None');
             }
         }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  useEffect(() => {
    if (!showDebug && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [showDebug]);

  return (
    <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl transition-all duration-300">
        
        {/* Video Container */}
        <div className="relative w-48 h-36 rounded-xl overflow-hidden bg-black/80 border border-white/5 ring-1 ring-white/10">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover transform scale-x-[-1]" 
            muted 
          />
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
          
          {/* Status Badge */}
          {cameraActive && (
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${currentGesture !== 'None' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                 <span className="text-[10px] text-white font-mono uppercase tracking-wider">
                    {currentGesture === 'None' ? 'No Hand' : currentGesture.replace(/_/g, ' ')}
                 </span>
              </div>
          )}
        </div>
        
        {/* Controls Row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-white/70 font-mono">
            {!isLoaded ? (
              <span className="flex items-center gap-2 text-emerald-400/80"><Loader2 className="w-3 h-3 animate-spin" /> Loading AI...</span>
            ) : error ? (
              <span className="text-red-400">{error}</span>
            ) : !cameraActive ? (
              <button onClick={enableCam} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 font-medium transition-colors shadow-lg shadow-emerald-900/20">
                <Camera className="w-3.5 h-3.5" /> Start Camera
              </button>
            ) : (
                <button 
                  onClick={() => setShowDebug(!showDebug)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-colors border ${showDebug ? 'bg-white/10 border-white/20 text-white' : 'text-white/40 border-transparent hover:text-white'}`}
                >
                    {showDebug ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {showDebug ? 'Hide Skeleton' : 'Show Skeleton'}
                </button>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        {cameraActive && (
            <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-white/40 grid grid-cols-3 gap-2 text-center">
                <div className={currentGesture === 'Open_Palm' ? 'text-emerald-400 font-bold' : ''}>
                    👋 Open<br/>SCATTER
                </div>
                <div className={currentGesture === 'Closed_Fist' ? 'text-emerald-400 font-bold' : ''}>
                    ✊ Fist<br/>HOLD
                </div>
                <div className={currentGesture === 'Index_Up' ? 'text-emerald-400 font-bold' : ''}>
                    ☝️ Index<br/>SPIN
                </div>
            </div>
        )}
      </div>
    </div>
  );
};