import React from 'react';
import { Game3D } from '../game/3d/game3d';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hammer, Box, ArrowUpCircle } from 'lucide-react';

interface TouchControlsProps {
  game: Game3D | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ game }) => {
  // Only render on touch-supported devices or if window has touch points
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  if (!isTouchDevice || !game) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-6 select-none md:hidden">
      {/* Left: Virtual D-Pad */}
      <div className="pointer-events-auto grid grid-cols-3 gap-2 w-36 h-36 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
        <div />
        <button
          onTouchStart={() => ((game.controls as any).keys['KeyW'] = true)}
          onTouchEnd={() => ((game.controls as any).keys['KeyW'] = false)}
          className="bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onTouchStart={() => ((game.controls as any).keys['KeyA'] = true)}
          onTouchEnd={() => ((game.controls as any).keys['KeyA'] = false)}
          className="bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div />
        <button
          onTouchStart={() => ((game.controls as any).keys['KeyD'] = true)}
          onTouchEnd={() => ((game.controls as any).keys['KeyD'] = false)}
          className="bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <div />
        <button
          onTouchStart={() => ((game.controls as any).keys['KeyS'] = true)}
          onTouchEnd={() => ((game.controls as any).keys['KeyS'] = false)}
          className="bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <div />
      </div>

      {/* Right: Action Buttons (Jump, Mine, Place) */}
      <div className="pointer-events-auto flex flex-col items-end gap-3 mb-16">
        <div className="flex gap-2">
          {/* Mine Button */}
          <button
            onTouchStart={() => {
              game.controls.isMiningHeld = true;
              game.controls.didMineOnce = true;
            }}
            onTouchEnd={() => {
              game.controls.isMiningHeld = false;
            }}
            className="w-14 h-14 bg-amber-500/80 active:bg-amber-400 text-slate-950 font-bold rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-amber-500/20"
          >
            <Hammer className="w-5 h-5" />
            <span className="text-[10px]">Mine</span>
          </button>

          {/* Place Button */}
          <button
            onTouchStart={() => {
              game.controls.didPlaceOnce = true;
            }}
            className="w-14 h-14 bg-cyan-500/80 active:bg-cyan-400 text-slate-950 font-bold rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-cyan-500/20"
          >
            <Box className="w-5 h-5" />
            <span className="text-[10px]">Place</span>
          </button>
        </div>

        {/* Jump Button */}
        <button
          onTouchStart={() => ((game.controls as any).keys['Space'] = true)}
          onTouchEnd={() => ((game.controls as any).keys['Space'] = false)}
          className="w-20 h-14 bg-white/20 active:bg-white/40 border border-white/20 text-white font-bold rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg"
        >
          <ArrowUpCircle className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
