import React from 'react';
import { Game3D } from '../game/3d/game3d';
import {
  X,
  Volume2,
  MousePointer,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Keyboard,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game3D | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  if (!isOpen || !game) return null;

  const [sensitivity, setSensitivity] = React.useState(game.controls.sensitivity * 1000);
  const [masterVolume, setMasterVolume] = React.useState(game.audio.masterVolume);
  const [timeOfDay, setTimeOfDay] = React.useState(game.renderer.timeOfDay);
  const [isDayCycleRunning, setIsDayCycleRunning] = React.useState(game.renderer.isDayCycleRunning);
  const [resetConfirmed, setResetConfirmed] = React.useState(false);

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    game.controls.sensitivity = val / 1000;
  };

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val);
    game.audio.setMasterVolume(val);
  };

  const handleTimePreset = (time: number) => {
    setTimeOfDay(time);
    game.renderer.timeOfDay = time;
    game.renderer.updateAtmosphere();
  };

  const handleToggleDayCycle = () => {
    const next = !isDayCycleRunning;
    setIsDayCycleRunning(next);
    game.renderer.isDayCycleRunning = next;
  };

  const handleResetWorld = () => {
    if (!resetConfirmed) {
      setResetConfirmed(true);
      return;
    }
    game.renderer.world.resetModifications();
    game.inventory.reset();
    const spawn = game.renderer.world.getSpawnPosition();
    game.physics.state.x = spawn.x;
    game.physics.state.y = spawn.y + 1;
    game.physics.state.z = spawn.z;
    game.physics.state.vx = 0;
    game.physics.state.vy = 0;
    game.physics.state.vz = 0;
    game.updateHandItem();
    game.showNotification('World & Inventory Reset to Pristine Spawn!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Game Settings & Controls</h2>
            <p className="text-xs text-slate-400">Configure visual atmosphere, audio, sensitivity, and keybindings</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Reference */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Input & Keybindings</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Move Forward/Back</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">W / S</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Strafe Left/Right</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">A / D</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Jump / Fly Up</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">Space</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Sprint / Fly Down</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">Shift</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Mine / Break Block</span>
                <span className="font-mono font-bold text-amber-400">Left Click</span>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Place Block</span>
                <span className="font-mono font-bold text-cyan-400">Right Click</span>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Pick Block</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">R / Mid</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Creative Flight</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">F</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Backpack / Craft</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-white">E / I</kbd>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-slate-300">Toggle Perspective</span>
                <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono font-bold text-indigo-400">V</kbd>
              </div>
            </div>
          </div>

          {/* Time of Day & Sky Atmosphere */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Atmosphere & Time of Day</span>
              </span>

              <button
                onClick={handleToggleDayCycle}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  isDayCycleRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/10 text-white/70 border-white/10'
                }`}
              >
                {isDayCycleRunning ? 'Day/Night Cycle: Active' : 'Cycle: Paused'}
              </button>
            </div>

            {/* Quick time presets */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => handleTimePreset(0.25)}
                className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex flex-col items-center gap-1 transition-colors"
              >
                <Sun className="w-4 h-4 text-orange-400" />
                <span>Sunrise (6 AM)</span>
              </button>
              <button
                onClick={() => handleTimePreset(0.5)}
                className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex flex-col items-center gap-1 transition-colors"
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Noon (12 PM)</span>
              </button>
              <button
                onClick={() => handleTimePreset(0.75)}
                className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex flex-col items-center gap-1 transition-colors"
              >
                <Sun className="w-4 h-4 text-rose-400" />
                <span>Sunset (6 PM)</span>
              </button>
              <button
                onClick={() => handleTimePreset(0.0)}
                className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex flex-col items-center gap-1 transition-colors"
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Midnight (12 AM)</span>
              </button>
            </div>

            {/* Manual time slider */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center gap-4">
              <span className="text-xs text-slate-300 w-24">Time Scrub</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={timeOfDay}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTimeOfDay(val);
                  game.renderer.timeOfDay = val;
                  game.renderer.updateAtmosphere();
                }}
                className="flex-1 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-slate-400 w-12 text-right">
                {Math.round(timeOfDay * 100)}%
              </span>
            </div>
          </div>

          {/* Mouse & Audio Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mouse Sensitivity */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-cyan-400" /> Mouse Sensitivity
                </span>
                <span className="font-mono tabular-nums text-white font-bold">{sensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="5.0"
                step="0.1"
                value={sensitivity}
                onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Master Audio */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Sound Effects Volume
                </span>
                <span className="font-mono tabular-nums text-white font-bold">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Reset World Danger Zone */}
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-red-300">Regenerate World</h4>
              <p className="text-[11px] text-slate-400">Clear all placed/broken blocks and restart at original spawn</p>
            </div>
            <button
              onClick={handleResetWorld}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                resetConfirmed
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
              }`}
            >
              {resetConfirmed ? 'Confirm Reset?' : 'Reset World'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Click canvas to lock cursor and return to game</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-lg shadow-md hover:from-amber-400 hover:to-amber-300 transition-all cursor-pointer"
          >
            Resume Game
          </button>
        </div>
      </div>
    </div>
  );
};
