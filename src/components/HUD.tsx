import React from 'react';
import { Game3DState } from '../game/3d/game3d';
import { PlayerInventory, ITEM_DEFS } from '../game/3d/resources';
import { getItemSprite, getItemFallbackSprite } from '../game/3d/iconGenerator';
import {
  Compass,
  Sun,
  Moon,
  Sparkles,
  Package,
  Settings,
  Eye,
} from 'lucide-react';

interface HUDProps {
  state: Game3DState | null;
  inventory: PlayerInventory;
  onSelectSlot: (slot: number) => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onToggleFly: () => void;
  onCycleCameraMode: () => void;
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

  // When inventory or settings modal is open, suppress rendering the gameplay hotbar & crosshair
  const isModalOpen = state.isInventoryOpen || state.isSettingsOpen;

  // Format time of day into 24h clock string
  const hours = Math.floor((state.timeOfDay * 24 + 6) % 24);
  const minutes = Math.floor(((state.timeOfDay * 24 * 60) % 60));
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const isNight = state.timeOfDay < 0.2 || state.timeOfDay > 0.8;

  const currentItem = inventory.getActiveSheetItem();
  const currentItemDef = currentItem ? ITEM_DEFS[currentItem.itemId] : null;

  // Hotbar dimensions scaling: 182x22 native -> scale x 2.5 or 2 (364px x 44px)
  const scale = 2.5; // 182 * 2.5 = 455px width, 22 * 2.5 = 55px height

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Top Bar: Coordinate Telemetry, Time, and Actions */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Location & Status */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-xs shadow-lg">
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

      {/* Center: Better Vanilla GUI Pixel Crosshair & Mining Progress (Hidden when inventory is open) */}
      {!isModalOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
          {/* Pixel-art Crosshair asset */}
          <img
            src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/crosshair.png"
            alt="Crosshair"
            className="w-4 h-4 md:w-5 md:h-5 [image-rendering:pixelated] select-none opacity-90 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"
          />

          {/* Targeted block label & Mining Progress */}
          {state.targetedBlock && (
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-white/90 bg-black/75 backdrop-blur-sm px-2.5 py-0.5 rounded-md border border-white/10 shadow-sm">
                {state.targetedBlock.name}
              </span>

              {/* Mining crack bar progress */}
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
      )}

      {/* Notification Toast */}
      {state.notification && (
        <div className="self-center mb-2 px-4 py-1.5 bg-black/80 backdrop-blur-md text-amber-300 text-xs font-medium rounded-full border border-amber-500/30 shadow-lg shadow-black/50 animate-bounce">
          {state.notification}
        </div>
      )}

      {/* Bottom HUD: Status Bars & Gameplay Hotbar (Hidden when modal/inventory is open to prevent duplicate hotbars) */}
      {!isModalOpen && (
      <div className="self-center flex flex-col items-center gap-1.5 pointer-events-auto">
        {/* Status Row: Hearts (Health) & Food / Stamina */}
        <div className="flex items-center justify-between w-[455px] px-1 mb-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {/* Hearts (10 Containers) */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="relative w-4 h-4 flex items-center justify-center">
                <img
                  src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/heart/container.png"
                  alt="Heart Container"
                  className="absolute inset-0 w-full h-full [image-rendering:pixelated]"
                />
                <img
                  src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/heart/full.png"
                  alt="Full Heart"
                  className="absolute inset-0 w-full h-full [image-rendering:pixelated]"
                />
              </div>
            ))}
          </div>

          {/* Experience / Level Counter Badge */}
          <div className="font-mono text-[11px] font-bold text-lime-400 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            LVL 1
          </div>

          {/* Food / Hunger (10 Food Sprites) */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center">
                <img
                  src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/food_full.png"
                  alt="Food"
                  className="w-full h-full [image-rendering:pixelated]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Experience Bar */}
        <div className="relative w-[455px] h-2 mb-1 flex items-center justify-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          <img
            src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/experience_bar_background.png"
            alt="XP Bar BG"
            className="absolute inset-0 w-full h-full object-fill [image-rendering:pixelated]"
          />
          <div className="absolute left-0 top-0 bottom-0 overflow-hidden w-[65%]">
            <img
              src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/experience_bar_progress.png"
              alt="XP Bar Progress"
              className="w-[455px] h-full object-fill [image-rendering:pixelated]"
            />
          </div>
        </div>

        {/* Hotbar Frame with Better Vanilla GUI Textures */}
        <div
          className="relative select-none"
          style={{
            width: `${182 * scale}px`,
            height: `${22 * scale}px`,
          }}
        >
          {/* Base 182x22 Hotbar Texture */}
          <img
            src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/hotbar.png"
            alt="Hotbar Background"
            className="absolute inset-0 w-full h-full object-fill [image-rendering:pixelated] drop-shadow-2xl"
          />

          {/* Active Hotbar Selection Overlay (24x23 sprite) */}
          <img
            src="/resourcepack/assets/minecraft/textures/gui/sprites/hud/hotbar_selection.png"
            alt="Selection"
            className="absolute top-[-2.5px] w-[60px] h-[57.5px] [image-rendering:pixelated] transition-all duration-75 pointer-events-none z-20"
            style={{
              left: `${(3 - 2 + inventory.selectedSlot * 20) * scale}px`,
            }}
          />

          {/* 9 Hotbar Slots */}
          <div className="absolute inset-0 flex items-center z-10">
            {inventory.hotbar.map((slot, idx) => {
              const itemDef = slot ? ITEM_DEFS[slot.itemId] : null;

              return (
                <button
                  key={idx}
                  onClick={() => onSelectSlot(idx)}
                  className="relative flex items-center justify-center group focus:outline-none"
                  style={{
                    width: `${20 * scale}px`,
                    height: `${20 * scale}px`,
                    marginLeft: idx === 0 ? `${3 * scale}px` : '0px',
                  }}
                >
                  {/* Slot hotkey index hint */}
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono text-white/30 group-hover:text-amber-300">
                    {idx + 1}
                  </span>

                  {/* Item / Block 32x32 sprite */}
                  {slot && itemDef && (
                    <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center">
                      <img
                        src={getItemSprite(slot.itemId)}
                        onError={(e) => {
                          e.currentTarget.src = getItemFallbackSprite(slot.itemId);
                        }}
                        alt={itemDef.name}
                        className="w-full h-full object-contain [image-rendering:pixelated] select-none pointer-events-none drop-shadow-md"
                      />
                    </div>
                  )}

                  {/* Item Count Badge */}
                  {slot && slot.count > 1 && (
                    <span className="absolute bottom-0.5 right-1.5 text-xs font-mono font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                      {slot.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active item tooltip */}
        <div className="h-5">
          {currentItemDef && (
            <span className="text-xs font-medium text-white/90 bg-black/60 px-3 py-0.5 rounded-full border border-white/10 backdrop-blur-sm shadow-md">
              {currentItemDef.name}
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
