
import React, { useRef, useEffect, useState } from 'react';
import { Color, Tool, Point, HandMode } from '../types';
import { Camera as CameraIcon, Play } from 'lucide-react';

interface AirCanvasProps {
  activeColor: Color;
  activeTool: Tool;
  brushSize: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  useSmoothing: boolean;
  onPredictGesture: () => void;
}

declare const Hands: any;
declare const Camera: any;
declare const drawConnectors: any;
declare const drawLandmarks: any;
declare const HAND_CONNECTIONS: any;

const AirCanvas: React.FC<AirCanvasProps> = ({
  activeColor,
  activeTool,
  brushSize,
  canvasRef,
  useSmoothing,
  onPredictGesture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [prevPoint, setPrevPoint] = useState<Point | null>(null);
  const [smoothedPoint, setSmoothedPoint] = useState<Point | null>(null);
  const [isHandReady, setIsHandReady] = useState(false);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [currentMode, setCurrentMode] = useState<HandMode>(HandMode.IDLE);
  const predictTimerRef = useRef<number | null>(null);

  // Refs for stable access in callbacks
  const configRef = useRef({ activeColor, activeTool, brushSize, useSmoothing, onPredictGesture });
  const drawStateRef = useRef({ prevPoint, smoothedPoint });

  useEffect(() => {
    configRef.current = { activeColor, activeTool, brushSize, useSmoothing, onPredictGesture };
  }, [activeColor, activeTool, brushSize, useSmoothing, onPredictGesture]);

  useEffect(() => {
    drawStateRef.current = { prevPoint, smoothedPoint };
  }, [prevPoint, smoothedPoint]);

  useEffect(() => {
    // Only initialize when the user manually starts the camera
    if (!isCameraStarted || !videoRef.current || !overlayRef.current || !canvasRef.current) return;

    let isDestroyed = false;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    const overlayCtx = overlay.getContext('2d')!;
    const drawCtx = canvas.getContext('2d')!;

    const alpha = 0.35;

    // Initialize Hands
    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.8,
    });

    const onResults = (results: any) => {
      if (isDestroyed) return;
      
      const { 
        activeColor: currentActiveColor, 
        activeTool: currentActiveTool, 
        brushSize: currentBrushSize, 
        useSmoothing: currentUseSmoothing,
        onPredictGesture: currentOnPredictGesture 
      } = configRef.current;

      setIsHandReady(true);
      overlayCtx.save();
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];

        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        const isRingUp = ringTip.y < ringPip.y;

        const rawX = (1 - indexTip.x) * canvas.width;
        const rawY = indexTip.y * canvas.height;

        let finalX = rawX;
        let finalY = rawY;

        if (currentUseSmoothing) {
          const lastSmoothed = drawStateRef.current.smoothedPoint;
          if (lastSmoothed) {
            finalX = lastSmoothed.x * (1 - alpha) + rawX * alpha;
            finalY = lastSmoothed.y * (1 - alpha) + rawY * alpha;
          }
          setSmoothedPoint({ x: finalX, y: finalY });
        }

        let mode = HandMode.IDLE;
        if (isIndexUp && isMiddleUp && isRingUp) {
          mode = HandMode.PREDICT;
        } else if (isIndexUp && isMiddleUp) {
          mode = HandMode.SELECT;
        } else if (isIndexUp) {
          mode = HandMode.DRAW;
        }

        setCurrentMode(mode);

        if (mode === HandMode.PREDICT) {
          if (!predictTimerRef.current) {
            predictTimerRef.current = window.setTimeout(() => {
              currentOnPredictGesture();
              predictTimerRef.current = null;
            }, 1200);
          }
        } else {
          if (predictTimerRef.current) {
            window.clearTimeout(predictTimerRef.current);
            predictTimerRef.current = null;
          }
        }

        overlayCtx.beginPath();
        overlayCtx.arc(finalX, finalY, currentBrushSize / 2 + (mode === HandMode.SELECT ? 8 : 4), 0, 2 * Math.PI);
        
        if (mode === HandMode.DRAW) {
          overlayCtx.fillStyle = currentActiveColor.hex;
          overlayCtx.shadowBlur = 10;
          overlayCtx.shadowColor = currentActiveColor.hex;
        } else if (mode === HandMode.PREDICT) {
          overlayCtx.fillStyle = '#10b981';
          overlayCtx.shadowBlur = 20;
          overlayCtx.shadowColor = '#10b981';
        } else {
          overlayCtx.fillStyle = 'rgba(255,255,255,0.2)';
          overlayCtx.strokeStyle = 'white';
          overlayCtx.lineWidth = 2;
          overlayCtx.stroke();
        }
        overlayCtx.fill();

        drawConnectors(overlayCtx, landmarks, HAND_CONNECTIONS, { 
          color: mode === HandMode.PREDICT ? '#10b981' : '#ffffff44', 
          lineWidth: 2 
        });

        if (mode === HandMode.DRAW) {
          drawCtx.save();
          drawCtx.beginPath();
          drawCtx.lineCap = 'round';
          drawCtx.lineJoin = 'round';
          drawCtx.lineWidth = currentBrushSize;
          
          if (currentActiveTool === 'eraser') {
            drawCtx.globalCompositeOperation = 'destination-out';
          } else {
            drawCtx.globalCompositeOperation = 'source-over';
            drawCtx.strokeStyle = currentActiveColor.hex;
            drawCtx.shadowBlur = 2;
            drawCtx.shadowColor = currentActiveColor.hex;
          }

          const lastPoint = drawStateRef.current.prevPoint;
          if (lastPoint) {
            drawCtx.moveTo(lastPoint.x, lastPoint.y);
            drawCtx.lineTo(finalX, finalY);
            drawCtx.stroke();
          }
          drawCtx.restore();
          setPrevPoint({ x: finalX, y: finalY });
        } else {
          setPrevPoint(null);
        }
      } else {
        setPrevPoint(null);
        setSmoothedPoint(null);
        setCurrentMode(HandMode.IDLE);
      }
      overlayCtx.restore();
    };

    hands.onResults(onResults);

    const camera = new Camera(video, {
      onFrame: async () => {
        if (isDestroyed) return;
        try {
          await hands.send({ image: video });
        } catch (e) {
          console.debug("Frame capture suppressed during cleanup");
        }
      },
      width: 1280,
      height: 720,
    });

    const startCamera = async () => {
      try {
        await camera.start();
      } catch (err) {
        console.error("Sensor failed to start:", err);
        setIsCameraStarted(false);
      }
    };

    startCamera();

    return () => {
      isDestroyed = true;
      camera.stop();
      try {
        hands.close();
      } catch (err) {
        console.warn("Hands cleanup error:", err);
      }
      if (predictTimerRef.current) window.clearTimeout(predictTimerRef.current);
    };
  }, [isCameraStarted]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      {!isCameraStarted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[60] bg-slate-900/95 backdrop-blur-md">
          <div className="mb-8 p-6 bg-white/5 rounded-full border border-white/10">
            <CameraIcon size={48} className="text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">System Core Offline</h2>
          <p className="text-white/40 text-sm mb-8 max-w-xs text-center leading-relaxed">
            Chandra-Vision requires sensor access to process gesture inputs in realtime.
          </p>
          <button
            onClick={() => setIsCameraStarted(true)}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all active:scale-95 group"
          >
            <Play size={20} className="fill-current" />
            Initialize System Core
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="absolute w-full h-full object-cover scale-x-[-1] opacity-40 blur-[2px]"
            playsInline
          />
          
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute w-full h-full object-cover z-10 pointer-events-none"
          />

          <canvas
            ref={overlayRef}
            width={1280}
            height={720}
            className="absolute w-full h-full object-cover z-20 pointer-events-none"
          />

          {!isHandReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-950/50 backdrop-blur-sm">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full animate-ping absolute inset-0" />
                <div className="w-24 h-24 border-b-4 border-indigo-500 rounded-full animate-spin relative" />
              </div>
              <p className="mt-8 text-white/40 font-black uppercase tracking-[0.5em] text-sm">Syncing Sensor Input...</p>
            </div>
          )}

          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300">
            <div className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] border backdrop-blur-2xl transition-all shadow-xl ${
              currentMode === HandMode.DRAW 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 scale-110' 
                : currentMode === HandMode.PREDICT 
                ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500 animate-pulse scale-125' 
                : currentMode === HandMode.SELECT 
                ? 'bg-white/10 text-white border-white/20' 
                : 'bg-black/40 text-white/30 border-white/5'
            }`}>
              {currentMode === HandMode.DRAW ? '● Writing Mode' : 
               currentMode === HandMode.PREDICT ? '✨ Processing Input...' :
               currentMode === HandMode.SELECT ? '○ Pointer Active' : 'Scanning for Input...'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AirCanvas;
