import React, { useEffect, useRef, useState } from 'react';
import { Game3D, Game3DState } from './game/3d/game3d';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { MousePointer, Sparkles, X } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game3D | null>(null);

  const [gameState, setGameState] = useState<Game3DState | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    if (gameRef.current) return; // Prevent double init

    const game = new Game3D(containerRef.current);
    gameRef.current = game;

    game.onStateUpdate = (state) => {
      setGameState(state);
      setIsInventoryOpen(state.isInventoryOpen);
      setIsSettingsOpen(state.isSettingsOpen);
    };

    game.start();

    // Resize listener
    const handleResize = () => {
      game.resize();
    };
    window.addEventListener('resize', handleResize);

    // Audio resume on first user interaction
    const handleFirstInteraction = () => {
      game.audio.init();
      game.audio.resume();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const handleSelectSlot = (slot: number) => {
    if (gameRef.current) {
      gameRef.current.inventory.selectedSlot = slot;
      gameRef.current.inventory.save();
      gameRef.current.updateHandItem();
      gameRef.current.audio.playUIClick();
      setForceUpdate((n) => n + 1);
    }
  };

  const handleToggleInventory = () => {
    if (gameRef.current) {
      gameRef.current.isInventoryOpen = !isInventoryOpen;
      setIsInventoryOpen(!isInventoryOpen);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  };

  const handleToggleSettings = () => {
    if (gameRef.current) {
      gameRef.current.isSettingsOpen = !isSettingsOpen;
      setIsSettingsOpen(!isSettingsOpen);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  };

  const handleToggleFly = () => {
    if (gameRef.current) {
      gameRef.current.physics.state.isFlying = !gameRef.current.physics.state.isFlying;
      gameRef.current.showNotification(
        gameRef.current.physics.state.isFlying ? 'Creative Flight: ON' : 'Creative Flight: OFF'
      );
      gameRef.current.audio.playUIClick();
      setForceUpdate((n) => n + 1);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Floating HUD */}
      {gameRef.current && (
        <HUD
          state={gameState}
          inventory={gameRef.current.inventory}
          onSelectSlot={handleSelectSlot}
          onOpenInventory={handleToggleInventory}
          onOpenSettings={handleToggleSettings}
          onToggleFly={handleToggleFly}
          onCycleCameraMode={() => gameRef.current?.cycleCameraMode()}
        />
      )}

      {/* First-time Welcome Guide Banner */}
      {showWelcome && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] bg-slate-900/90 backdrop-blur-md border border-amber-400/30 rounded-2xl p-4 shadow-2xl text-white flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Welcome to Pixel Sandbox 3D</span>
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Click anywhere on the screen to lock cursor and look around. Press{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px]">WASD</kbd> to move,{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px]">Space</kbd> to jump,{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px]">Left Click</kbd> to mine,{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px]">Right Click</kbd> to place blocks, and{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px]">E</kbd> to open Crafting.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inventory & Crafting Modal */}
      {gameRef.current && (
        <InventoryModal
          isOpen={isInventoryOpen}
          onClose={() => {
            setIsInventoryOpen(false);
            if (gameRef.current) gameRef.current.isInventoryOpen = false;
          }}
          inventory={gameRef.current.inventory}
          audio={gameRef.current.audio}
          onInventoryChanged={() => {
            if (gameRef.current) gameRef.current.updateHandItem();
            setForceUpdate((n) => n + 1);
          }}
        />
      )}

      {/* Settings Modal */}
      {gameRef.current && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            if (gameRef.current) gameRef.current.isSettingsOpen = false;
          }}
          game={gameRef.current}
        />
      )}

      {/* Touch device controls */}
      <TouchControls game={gameRef.current} />
    </div>
  );
}
