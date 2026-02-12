
import React from 'react';
import { Color, COLORS, Tool } from '../types';
import { Eraser, Paintbrush, Trash2, Sliders, Zap, ZapOff } from 'lucide-react';

interface ToolbarProps {
  activeColor: Color;
  setActiveColor: (color: Color) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onClear: () => void;
  useSmoothing: boolean;
  setUseSmoothing: (val: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeColor,
  setActiveColor,
  activeTool,
  setActiveTool,
  brushSize,
  setBrushSize,
  onClear,
  useSmoothing,
  setUseSmoothing,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-2xl border-b border-white/10 p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Chandra-Vision v1.0
          </h1>
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black">Advanced Gesture Recognition System</span>
        </div>

        {/* Color Selection */}
        <div className="flex gap-2 p-1 bg-black/50 rounded-full border border-white/10">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => {
                setActiveColor(color);
                setActiveTool('brush');
              }}
              className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                activeColor.id === color.id && activeTool === 'brush'
                  ? 'ring-2 ring-white scale-110'
                  : 'hover:scale-105 opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>

        {/* Tools */}
        <div className="flex gap-2 border-l border-white/10 pl-4">
          <button
            onClick={() => setActiveTool('brush')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'brush'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
            title="Brush"
          >
            <Paintbrush size={18} />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTool === 'eraser'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
          <button
            onClick={onClear}
            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            title="Clear Canvas"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Smoothing Toggle */}
        <button
          onClick={() => setUseSmoothing(!useSmoothing)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-widest ${
            useSmoothing 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-white/5 border-white/10 text-white/30'
          }`}
        >
          {useSmoothing ? <Zap size={14} /> : <ZapOff size={14} />}
          {useSmoothing ? 'Stabilizer On' : 'Raw Input'}
        </button>

        {/* Brush Size */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
          <Sliders size={14} className="text-white/40" />
          <input
            type="range"
            min="2"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] font-mono text-white/60 w-8">{brushSize}px</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
