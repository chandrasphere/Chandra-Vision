
import React, { useState, useRef, useCallback } from 'react';
import AirCanvas from './components/AirCanvas';
import Toolbar from './components/Toolbar';
import { Color, COLORS, Tool } from './types';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Zap, X, Type, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const [activeColor, setActiveColor] = useState<Color>(COLORS[4]); // Default to white
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [predictedText, setPredictedText] = useState<string | null>(null);
  const [useSmoothing, setUseSmoothing] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleClearAll = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPredictedText(null);
        setAnalysisResult(null);
      }
    }
  };

  const handlePredictText = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || isProcessing) return;

    setIsProcessing(true);
    try {
      const base64Image = canvas.toDataURL('image/png').split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { text: "Extract any handwritten text or characters from this image. Return ONLY the recognized text. If no text is found, say 'No text detected'." },
            { inlineData: { data: base64Image, mimeType: 'image/png' } }
          ]
        }
      });

      const text = response.text?.trim() || "No text detected";
      setPredictedText(text);
    } catch (error) {
      console.error("Processing Error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleGeneralAnalyze = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    try {
      const base64Image = canvas.toDataURL('image/png').split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Analyze this air-writing. What was the user trying to draw or write? Give a brief, insightful description." },
            { inlineData: { data: base64Image, mimeType: 'image/png' } }
          ]
        }
      });

      setAnalysisResult(response.text || "Output generated successfully.");
    } catch (error) {
      console.error("System Error:", error);
      setAnalysisResult("System failed to process input.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-black font-sans overflow-hidden">
      {/* Header Toolbar */}
      <div className="absolute top-0 left-0 w-full z-20">
        <Toolbar 
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onClear={handleClearAll}
          useSmoothing={useSmoothing}
          setUseSmoothing={setUseSmoothing}
        />
      </div>

      {/* Main Experience */}
      <AirCanvas 
        activeColor={activeColor}
        activeTool={activeTool}
        brushSize={brushSize}
        canvasRef={canvasRef}
        useSmoothing={useSmoothing}
        onPredictGesture={handlePredictText}
      />

      {/* System Results Overlay */}
      <div className="absolute bottom-12 right-8 z-30 flex flex-col items-end gap-4 max-w-sm pointer-events-none">
        {analysisResult && (
          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto">
            <button 
              onClick={() => setAnalysisResult(null)}
              className="absolute top-2 right-2 text-white/50 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="text-blue-400" size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">System Insights</span>
            </div>
            <p className="text-sm leading-relaxed text-white/90">{analysisResult}</p>
          </div>
        )}

        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={handlePredictText}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 group"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Type size={20} />}
            Extract Text
          </button>
          <button
            onClick={handleGeneralAnalyze}
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 group"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            Neural Analysis
          </button>
        </div>
      </div>

      {/* OCR Preview Box */}
      {predictedText && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl border border-emerald-500/50 px-8 py-4 rounded-3xl shadow-2xl flex flex-col items-center">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] mb-1">System Output</span>
            <p className="text-3xl font-black text-white tracking-tight">{predictedText}</p>
          </div>
        </div>
      )}

      {/* Footer Credit */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
          Developed by Chandra Diwakar | CSE Student
        </p>
      </div>

      {/* Gesture Legend */}
      <div className="absolute top-24 left-8 z-30 pointer-events-none hidden md:block">
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-[10px] text-white/60 space-y-2">
          <p className="font-bold text-white/80 border-b border-white/10 pb-1 mb-1">COMMAND GESTURES</p>
          <div className="flex items-center gap-2">
            <span className="w-8 py-0.5 bg-white/10 rounded flex justify-center text-blue-400">☝️</span>
            <span>INDEX: <b className="text-blue-400">DRAW</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 py-0.5 bg-white/10 rounded flex justify-center text-green-400">✌️</span>
            <span>TWO FINGERS: <b className="text-green-400">HOVER</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 py-0.5 bg-white/10 rounded flex justify-center text-amber-400">🤟</span>
            <span>THREE FINGERS: <b className="text-amber-400">PROCESS</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
