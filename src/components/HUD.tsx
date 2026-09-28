import React from 'react';
import { Game3DState } from '../game/3d/game3d';
import { PlayerInventory, ITEM_DEFS } from '../game/3d/resources';
import { getItemSprite } from '../game/3d/iconGenerator';
import {
  Compass,
  Sun,
  Moon,
  Sparkles,
  Package,
  Settings,
  Flame,
  Box,
  Layers,
  Sword,
  BookOpen,
  Gem,
  Hammer,
  TreePine,
  Leaf,
  Maximize2,
  Grid,
  LayoutGrid,
  Eye,
} from 'lucide-react';

const PickaxeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 21 11-11" />
    <path d="m13 4 7 7" />
    <path d="M14 3a16.5 16.5 0 0 1 7 7" />
  </svg>
);

interface HUDProps {
  state: Game3DState | null;
  inventory: PlayerInventory;
  onSelectSlot: (slot: number) => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onToggleFly: () => void;
  onCycleCameraMode: () => void;
}

// Icon mapper for items
function getItemIcon(iconName: string, color: string) {
  const props = { className: 'w-6 h-6 shrink-0', style: { color } };
  switch (iconName) {
    case 'Pickaxe': return <PickaxeIcon {...props} />;
    case 'Sword': return <Sword {...props} />;
    case 'TreePine': return <TreePine {...props} />;
    case 'Leaf': return <Leaf {...props} />;
    case 'Flame': return <Flame {...props} />;
    case 'Gem': return <Gem {...props} />;
    case 'Hammer': return <Hammer {...props} />;
    case 'BookOpen': return <BookOpen {...props} />;
    case 'Maximize2': return <Maximize2 {...props} />;
    case 'Grid': return <Grid {...props} />;
    case 'LayoutGrid': return <LayoutGrid {...props} />;
    case 'Layers': return <Layers {...props} />;
    default: return <Box {...props} />;
  }
}

export const HUD: React.FC<HUDProps> = ({
  state,
  inventory,
  onSelectSlot,
  onOpenInventory,
  onOpenSettings,
  onToggleFly,
  onCycleCameraMode,
}) => {
  if (!state) return null;

  // Format time of day into 24h clock string
  const hours = Math.floor((state.timeOfDay * 24 + 6) % 24);
  const minutes = Math.floor(((state.timeOfDay * 24 * 60) % 60));
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const isNight = state.timeOfDay < 0.2 || state.timeOfDay > 0.8;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Top Bar: Coordinate Telemetry, Time, and Actions */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Location & Status */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-xs">
          <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-300">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>X: {state.playerPos.x}</span>
            <span className="text-white/20">/</span>
            <span>Y: {state.playerPos.y}</span>
            <span className="text-white/20">/</span>
            <span>Z: {state.playerPos.z}</span>
          </div>
          <span className="text-white/20">·</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-mono tabular-nums">{timeStr}</span>
          </div>
          <span className="text-white/20">·</span>
          <span className="font-mono tabular-nums text-emerald-400">{state.fps} FPS</span>
          {state.isFlying && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-amber-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Fly Mode
              </span>
            </>
          )}
        </div>

        {/* Right: Quick buttons (clickable) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onCycleCameraMode}
            title="Toggle Camera: 1st Person / 3rd Person / 2.5D Isometric (V)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-indigo-300 hover:text-white transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize font-mono">
              {state.cameraMode === 'third' ? '3rd Person (V)' : state.cameraMode === 'isometric' ? '2.5D View (V)' : '1st Person (V)'}
            </span>
          </button>

          <button
            onClick={onToggleFly}
            title="Toggle Creative Flight (F)"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg backdrop-blur-md border transition-all ${
              state.isFlying
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-black/60 border-white/10 text-white/80 hover:bg-black/80 hover:text-white'
            }`}
          >
            {state.isFlying ? 'Flying (F)' : 'Walk (F)'}
          </button>

          <button
            onClick={onOpenInventory}
            title="Open Backpack & Crafting (E)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/90 hover:text-white transition-all shadow-sm"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Craft (E)</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Game Settings (ESC)"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/90 hover:text-white transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Crosshair & Mining Progress */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        {/* Sleek minimalist crosshair */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
          <div className="absolute h-2.5 w-0.5 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
        </div>

        {/* Targeted block label & Mining Progress */}
        {state.targetedBlock && (
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-white/90 bg-black/70 backdrop-blur-sm px-2.5 py-0.5 rounded-md border border-white/10 shadow-sm">
              {state.targetedBlock.name}
            </span>

            {/* Mining crack radial or bar progress */}
            {state.miningProgress > 0 && (
              <div className="w-20 h-1.5 bg-black/70 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-75"
                  style={{ width: `${Math.min(100, state.miningProgress * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {state.notification && (
        <div className="self-center mb-2 px-4 py-1.5 bg-black/80 backdrop-blur-md text-amber-300 text-xs font-medium rounded-full border border-amber-500/30 shadow-lg shadow-black/50 animate-bounce">
          {state.notification}
        </div>
      )}

      {/* Bottom Bar: 9-Slot Minecraft Hotbar */}
      <div className="self-center flex flex-col items-center gap-2 pointer-events-auto">
        {/* Hotbar Container */}
        <div className="flex items-center gap-1.5 p-1.5 bg-black/70 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl">
          {inventory.hotbar.map((slot, idx) => {
            const isSelected = idx === inventory.selectedSlot;
            const itemDef = slot ? ITEM_DEFS[slot.itemId] : null;

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white/20 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] scale-105 z-10'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25'
                }`}
              >
                {/* Slot hotkey number (1-9) */}
                <span className="absolute top-1 left-1.5 text-[10px] font-mono text-white/40">
                  {idx + 1}
                </span>

                {/* 32x32 indie pixel-art item / block sprite */}
                {slot && itemDef && (
                  <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center">
                    <img
                      src={getItemSprite(slot.itemId)}
                      alt={itemDef.name}
                      className="w-full h-full object-contain [image-rendering:pixelated] select-none pointer-events-none drop-shadow-md"
                    />
                  </div>
                )}

                {/* Item count badge */}
                {slot && slot.count > 1 && (
                  <span className="absolute bottom-1 right-1.5 text-xs font-mono font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {slot.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected item name tooltip */}
        <div className="h-5">
          {inventory.getActiveSheetItem() && (
            <span className="text-xs font-medium text-white/90 bg-black/50 px-3 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
              {ITEM_DEFS[inventory.getActiveSheetItem()!.itemId]?.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
