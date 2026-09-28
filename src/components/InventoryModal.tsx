import React, { useState } from 'react';
import {
  PlayerInventory,
  ITEM_DEFS,
  CRAFTING_RECIPES,
  CraftingRecipe,
} from '../game/3d/resources';
import { getItemSprite, getItemFallbackSprite } from '../game/3d/iconGenerator';
import { AudioManager } from '../game/audio';
import {
  X,
  Hammer,
  Sparkles,
} from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PlayerInventory;
  audio: AudioManager;
  onInventoryChanged: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  audio,
  onInventoryChanged,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(CRAFTING_RECIPES[0]);

  if (!isOpen) return null;

  // Filter recipes
  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const handleCraft = (recipe: CraftingRecipe) => {
    const success = inventory.craft(recipe);
    if (success) {
      audio.playCraft();
      onInventoryChanged();
    } else {
      audio.playUIError();
    }
  };

  // Quick Creative Fill (for testing / creative building)
  const handleCreativeFill = () => {
    inventory.addItem('planks', 64);
    inventory.addItem('cobblestone', 64);
    inventory.addItem('torch', 32);
    inventory.addItem('glass', 32);
    inventory.addItem('brick', 32);
    inventory.addItem('stone_bricks', 32);
    inventory.addItem('diamond', 10);
    audio.playPickup();
    onInventoryChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Backpack & Crafting</h2>
              <p className="text-xs text-slate-400">Craft blocks, tools, and manage collected resources</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreativeFill}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creative Supply</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Crafting, Right Inventory */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* Crafting Station (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4 border-r border-white/10 pr-0 md:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recipes</span>
              {/* Category tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/10 text-xs">
                {(['all', 'blocks', 'tools', 'materials', 'decorations'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-md capitalize font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[300px] pr-1">
              {filteredRecipes.map((recipe) => {
                const canCraft = inventory.canCraft(recipe);
                const isSelected = selectedRecipe?.id === recipe.id;

                return (
                  <button
                    key={recipe.id}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      audio.playUIHover();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-white/15 border-amber-400/80 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-lg bg-black/40 border border-white/15 flex items-center justify-center p-0.5 shrink-0">
                        <img
                          src={getItemSprite(recipe.resultId)}
                          onError={(e) => {
                            e.currentTarget.src = getItemFallbackSprite(recipe.resultId);
                          }}
                          alt={recipe.name}
                          className="w-full h-full object-contain [image-rendering:pixelated]"
                        />
                        {recipe.resultCount > 1 && (
                          <span className="absolute bottom-0 right-0.5 text-[9px] font-mono font-bold text-white drop-shadow">
                            {recipe.resultCount}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{recipe.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          {recipe.requires.map((req, i) => (
                            <span key={req.itemId} className="flex items-center gap-0.5">
                              {i > 0 && <span className="text-white/30 mr-0.5">+</span>}
                              {req.count} {ITEM_DEFS[req.itemId]?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        canCraft
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-500'
                      }`}
                    >
                      {canCraft ? 'Ready' : 'Need items'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Recipe Detail & Craft Action */}
            {selectedRecipe && (
              <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedRecipe.name}</h4>
                    <p className="text-xs text-slate-400">{selectedRecipe.description}</p>
                  </div>
                  <div className="relative w-11 h-11 rounded-lg bg-black/50 flex items-center justify-center p-1 border border-white/20 shadow-md shrink-0">
                    <img
                      src={getItemSprite(selectedRecipe.resultId)}
                      onError={(e) => {
                        e.currentTarget.src = getItemFallbackSprite(selectedRecipe.resultId);
                      }}
                      alt={selectedRecipe.name}
                      className="w-full h-full object-contain [image-rendering:pixelated]"
                    />
                    {selectedRecipe.resultCount > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white drop-shadow">
                        ×{selectedRecipe.resultCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ingredients checklist */}
                <div className="space-y-1.5 text-xs">
                  {selectedRecipe.requires.map((req) => {
                    const have = inventory.countItem(req.itemId);
                    const satisfied = have >= req.count;
                    const def = ITEM_DEFS[req.itemId];
                    return (
                      <div key={req.itemId} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getItemSprite(req.itemId)}
                            onError={(e) => {
                              e.currentTarget.src = getItemFallbackSprite(req.itemId);
                            }}
                            alt={def?.name || req.itemId}
                            className="w-4 h-4 object-contain [image-rendering:pixelated]"
                          />
                          <span className="text-slate-300">{def?.name || req.itemId}</span>
                        </div>
                        <span className={`font-mono tabular-nums ${satisfied ? 'text-emerald-400' : 'text-red-400'}`}>
                          {have} / {req.count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={!inventory.canCraft(selectedRecipe)}
                  onClick={() => handleCraft(selectedRecipe)}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                    inventory.canCraft(selectedRecipe)
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 cursor-pointer'
                      : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  Craft {selectedRecipe.resultCount} {selectedRecipe.name}
                </button>
              </div>
            )}
          </div>

          {/* Player Inventory (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-5">
            {/* Backpack Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Backpack ({inventory.backpack.length} Slots)</span>
                <span className="text-xs text-slate-500">Click item to swap with active hotbar slot</span>
              </div>

              {/* 4x9 Grid for 36 slots */}
              <div className="grid grid-cols-9 gap-1.5 p-2 bg-black/40 rounded-xl border border-white/10 max-h-[260px] overflow-y-auto">
                {inventory.backpack.map((slot, idx) => {
                  const def = slot ? ITEM_DEFS[slot.itemId] : null;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (slot) {
                          // Swap with selected hotbar slot
                          const active = inventory.hotbar[inventory.selectedSlot];
                          inventory.hotbar[inventory.selectedSlot] = slot;
                          inventory.backpack[idx] = active;
                          inventory.save();
                          audio.playUIClick();
                          onInventoryChanged();
                        }
                      }}
                      className="relative aspect-square rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all p-1"
                    >
                      {slot && def && (
                        <div
                          className="w-full h-full flex items-center justify-center p-0.5"
                          title={`${def.name} (${slot.count})`}
                        >
                          <img
                            src={getItemSprite(slot.itemId)}
                            onError={(e) => {
                              e.currentTarget.src = getItemFallbackSprite(slot.itemId);
                            }}
                            alt={def.name}
                            className="w-full h-full object-contain [image-rendering:pixelated] select-none pointer-events-none drop-shadow-sm"
                          />
                        </div>
                      )}
                      {slot && slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white drop-shadow">
                          {slot.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hotbar Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Hotbar (Active Hand)</span>
                <span className="text-xs text-amber-400 font-mono">Slot {inventory.selectedSlot + 1} active</span>
              </div>

              {/* 1x9 Grid */}
              <div className="grid grid-cols-9 gap-1.5 p-2 bg-black/60 rounded-xl border border-white/15">
                {inventory.hotbar.map((slot, idx) => {
                  const isSelected = idx === inventory.selectedSlot;
                  const def = slot ? ITEM_DEFS[slot.itemId] : null;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        inventory.selectedSlot = idx;
                        inventory.save();
                        audio.playUIClick();
                        onInventoryChanged();
                      }}
                      className={`relative aspect-square rounded-lg border transition-all p-1 flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-400/20 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="absolute top-0.5 left-1 text-[9px] font-mono text-white/30">
                        {idx + 1}
                      </span>

                      {slot && def && (
                        <div
                          className="w-full h-full flex items-center justify-center p-0.5 mt-1"
                          title={`${def.name} (${slot.count})`}
                        >
                          <img
                            src={getItemSprite(slot.itemId)}
                            onError={(e) => {
                              e.currentTarget.src = getItemFallbackSprite(slot.itemId);
                            }}
                            alt={def.name}
                            className="w-full h-full object-contain [image-rendering:pixelated] select-none pointer-events-none drop-shadow-sm"
                          />
                        </div>
                      )}
                      {slot && slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white drop-shadow">
                          {slot.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 text-white rounded font-mono">E</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 text-white rounded font-mono">ESC</kbd> to return to game</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
