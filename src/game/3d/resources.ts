// ============================================================
// RESOURCES & CRAFTING - Complete inventory and crafting system
// ============================================================
import { BlockType } from './blocks';

export type ItemCategory = 'blocks' | 'tools' | 'materials' | 'decorations';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  blockType?: BlockType; // if placeable block
  iconName: string;
  color: string;
  maxStack: number;
  toolType?: 'pickaxe' | 'axe' | 'shovel' | 'sword';
  miningPower?: number; // multiplier for mining speed
  attackDamage?: number;
  description: string;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: ItemCategory;
  resultId: string;
  resultCount: number;
  requires: { itemId: string; count: number }[];
  description: string;
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  // Blocks
  grass: { id: 'grass', name: 'Grass Block', category: 'blocks', blockType: BlockType.GRASS, iconName: 'Layers', color: '#4caf50', maxStack: 64, description: 'Lush topsoil block' },
  dirt: { id: 'dirt', name: 'Dirt', category: 'blocks', blockType: BlockType.DIRT, iconName: 'Square', color: '#795548', maxStack: 64, description: 'Rich brown soil' },
  stone: { id: 'stone', name: 'Stone', category: 'blocks', blockType: BlockType.STONE, iconName: 'Box', color: '#9e9e9e', maxStack: 64, description: 'Solid natural rock' },
  cobblestone: { id: 'cobblestone', name: 'Cobblestone', category: 'blocks', blockType: BlockType.COBBLESTONE, iconName: 'Boxes', color: '#757575', maxStack: 64, description: 'Quarried stone for building' },
  wood: { id: 'wood', name: 'Oak Log', category: 'blocks', blockType: BlockType.WOOD, iconName: 'TreePine', color: '#6d4c41', maxStack: 64, description: 'Raw timber from trees' },
  planks: { id: 'planks', name: 'Oak Planks', category: 'blocks', blockType: BlockType.PLANKS, iconName: 'Square', color: '#d7ccc8', maxStack: 64, description: 'Refined lumber for structures' },
  leaves: { id: 'leaves', name: 'Oak Leaves', category: 'blocks', blockType: BlockType.LEAVES, iconName: 'Leaf', color: '#2e7d32', maxStack: 64, description: 'Dense green foliage' },
  sand: { id: 'sand', name: 'Sand', category: 'blocks', blockType: BlockType.SAND, iconName: 'Sparkles', color: '#fbc02d', maxStack: 64, description: 'Fine golden grains' },
  glass: { id: 'glass', name: 'Glass', category: 'blocks', blockType: BlockType.GLASS, iconName: 'Maximize2', color: '#80deea', maxStack: 64, description: 'Crystal clear window pane' },
  brick: { id: 'brick', name: 'Bricks', category: 'blocks', blockType: BlockType.BRICK, iconName: 'Grid', color: '#c62828', maxStack: 64, description: 'Kiln-fired sturdy red bricks' },
  stone_bricks: { id: 'stone_bricks', name: 'Stone Bricks', category: 'blocks', blockType: BlockType.STONE_BRICKS, iconName: 'LayoutGrid', color: '#616161', maxStack: 64, description: 'Carved castle stone bricks' },
  torch: { id: 'torch', name: 'Torch', category: 'decorations', blockType: BlockType.TORCH, iconName: 'Flame', color: '#ffb300', maxStack: 64, description: 'Warm beacon of light' },
  crafting_table: { id: 'crafting_table', name: 'Crafting Table', category: 'decorations', blockType: BlockType.CRAFTING_TABLE, iconName: 'Hammer', color: '#8d6e63', maxStack: 64, description: 'Advanced crafting workstation' },
  bookshelf: { id: 'bookshelf', name: 'Bookshelf', category: 'decorations', blockType: BlockType.BOOKSHELF, iconName: 'BookOpen', color: '#a1887f', maxStack: 64, description: 'Library shelf filled with tomes' },
  coal_ore: { id: 'coal_ore', name: 'Coal Ore', category: 'materials', blockType: BlockType.COAL_ORE, iconName: 'Circle', color: '#424242', maxStack: 64, description: 'Stone vein rich with coal' },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', category: 'materials', blockType: BlockType.IRON_ORE, iconName: 'Circle', color: '#d1c4e9', maxStack: 64, description: 'Unrefined metallic iron deposit' },
  gold_ore: { id: 'gold_ore', name: 'Gold Ore', category: 'materials', blockType: BlockType.GOLD_ORE, iconName: 'Circle', color: '#ffd54f', maxStack: 64, description: 'Precious glittering gold vein' },
  diamond_ore: { id: 'diamond_ore', name: 'Diamond Ore', category: 'materials', blockType: BlockType.DIAMOND_ORE, iconName: 'Gem', color: '#00e5ff', maxStack: 64, description: 'Ultra-rare diamond ore vein' },

  // Raw Materials
  stick: { id: 'stick', name: 'Stick', category: 'materials', iconName: 'Minus', color: '#8d6e63', maxStack: 64, description: 'Carved wooden handle' },
  coal: { id: 'coal', name: 'Coal Lump', category: 'materials', iconName: 'Flame', color: '#212121', maxStack: 64, description: 'Lump of high-grade coal fuel' },
  iron_ingot: { id: 'iron_ingot', name: 'Iron Ingot', category: 'materials', iconName: 'Shield', color: '#cfd8dc', maxStack: 64, description: 'Smelted industrial iron bar' },
  gold_ingot: { id: 'gold_ingot', name: 'Gold Ingot', category: 'materials', iconName: 'Award', color: '#ffca28', maxStack: 64, description: 'Poured pure gold ingot' },
  diamond: { id: 'diamond', name: 'Diamond', category: 'materials', iconName: 'Gem', color: '#00e5ff', maxStack: 64, description: 'Pristine cut diamond crystal' },

  // Tools
  pickaxe_wood: { id: 'pickaxe_wood', name: 'Wooden Pickaxe', category: 'tools', iconName: 'Pickaxe', color: '#8d6e63', maxStack: 1, toolType: 'pickaxe', miningPower: 1.5, description: 'Basic pickaxe for stone' },
  pickaxe_stone: { id: 'pickaxe_stone', name: 'Stone Pickaxe', category: 'tools', iconName: 'Pickaxe', color: '#757575', maxStack: 1, toolType: 'pickaxe', miningPower: 2.5, description: 'Durable pickaxe for iron/coal' },
  pickaxe_iron: { id: 'pickaxe_iron', name: 'Iron Pickaxe', category: 'tools', iconName: 'Pickaxe', color: '#eceff1', maxStack: 1, toolType: 'pickaxe', miningPower: 4.0, description: 'Fast pickaxe for gold/diamond' },
  pickaxe_diamond: { id: 'pickaxe_diamond', name: 'Diamond Pickaxe', category: 'tools', iconName: 'Pickaxe', color: '#00e5ff', maxStack: 1, toolType: 'pickaxe', miningPower: 7.0, description: 'Ultimate legendary pickaxe' },

  axe_wood: { id: 'axe_wood', name: 'Wooden Axe', category: 'tools', iconName: 'Axe', color: '#8d6e63', maxStack: 1, toolType: 'axe', miningPower: 1.8, description: 'Chops trees efficiently' },
  axe_iron: { id: 'axe_iron', name: 'Iron Axe', category: 'tools', iconName: 'Axe', color: '#eceff1', maxStack: 1, toolType: 'axe', miningPower: 4.5, description: 'Rapid wood feller' },

  sword_wood: { id: 'sword_wood', name: 'Wooden Sword', category: 'tools', iconName: 'Sword', color: '#8d6e63', maxStack: 1, toolType: 'sword', attackDamage: 4, description: 'Basic defense blade' },
  sword_iron: { id: 'sword_iron', name: 'Iron Sword', category: 'tools', iconName: 'Sword', color: '#eceff1', maxStack: 1, toolType: 'sword', attackDamage: 8, description: 'Sharp forged steel sword' },
  sword_diamond: { id: 'sword_diamond', name: 'Diamond Sword', category: 'tools', iconName: 'Sword', color: '#00e5ff', maxStack: 1, toolType: 'sword', attackDamage: 12, description: 'Masterwork diamond blade' },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_planks',
    name: 'Oak Planks',
    category: 'blocks',
    resultId: 'planks',
    resultCount: 4,
    requires: [{ itemId: 'wood', count: 1 }],
    description: 'Convert raw logs into building planks',
  },
  {
    id: 'craft_sticks',
    name: 'Sticks',
    category: 'materials',
    resultId: 'stick',
    resultCount: 4,
    requires: [{ itemId: 'planks', count: 2 }],
    description: 'Carve planks into tool handles',
  },
  {
    id: 'craft_torches',
    name: 'Torches',
    category: 'decorations',
    resultId: 'torch',
    resultCount: 4,
    requires: [{ itemId: 'coal', count: 1 }, { itemId: 'stick', count: 1 }],
    description: 'Create luminous lanterns for caves and night',
  },
  {
    id: 'craft_crafting_table',
    name: 'Crafting Table',
    category: 'decorations',
    resultId: 'crafting_table',
    resultCount: 1,
    requires: [{ itemId: 'planks', count: 4 }],
    description: 'Sturdy workbench for complex creations',
  },
  {
    id: 'craft_stone_bricks',
    name: 'Stone Bricks',
    category: 'blocks',
    resultId: 'stone_bricks',
    resultCount: 4,
    requires: [{ itemId: 'cobblestone', count: 4 }],
    description: 'Chisel cobblestone into fortress bricks',
  },
  {
    id: 'craft_glass',
    name: 'Glass',
    category: 'blocks',
    resultId: 'glass',
    resultCount: 2,
    requires: [{ itemId: 'sand', count: 4 }],
    description: 'Fired silica window panes',
  },
  {
    id: 'craft_brick',
    name: 'Bricks',
    category: 'blocks',
    resultId: 'brick',
    resultCount: 4,
    requires: [{ itemId: 'dirt', count: 4 }],
    description: 'Bake clay-rich dirt into strong red bricks',
  },
  {
    id: 'craft_bookshelf',
    name: 'Bookshelf',
    category: 'decorations',
    resultId: 'bookshelf',
    resultCount: 1,
    requires: [{ itemId: 'planks', count: 6 }],
    description: 'Decorative library bookshelf',
  },
  {
    id: 'craft_pickaxe_wood',
    name: 'Wooden Pickaxe',
    category: 'tools',
    resultId: 'pickaxe_wood',
    resultCount: 1,
    requires: [{ itemId: 'planks', count: 3 }, { itemId: 'stick', count: 2 }],
    description: 'Mines stone and coal deposits',
  },
  {
    id: 'craft_pickaxe_stone',
    name: 'Stone Pickaxe',
    category: 'tools',
    resultId: 'pickaxe_stone',
    resultCount: 1,
    requires: [{ itemId: 'cobblestone', count: 3 }, { itemId: 'stick', count: 2 }],
    description: 'Mines iron and coal deposits faster',
  },
  {
    id: 'craft_pickaxe_iron',
    name: 'Iron Pickaxe',
    category: 'tools',
    resultId: 'pickaxe_iron',
    resultCount: 1,
    requires: [{ itemId: 'iron_ingot', count: 3 }, { itemId: 'stick', count: 2 }],
    description: 'High-speed pickaxe capable of mining gold & diamond',
  },
  {
    id: 'craft_pickaxe_diamond',
    name: 'Diamond Pickaxe',
    category: 'tools',
    resultId: 'pickaxe_diamond',
    resultCount: 1,
    requires: [{ itemId: 'diamond', count: 3 }, { itemId: 'stick', count: 2 }],
    description: 'The pinnacle of mining efficiency',
  },
  {
    id: 'craft_axe_iron',
    name: 'Iron Axe',
    category: 'tools',
    resultId: 'axe_iron',
    resultCount: 1,
    requires: [{ itemId: 'iron_ingot', count: 3 }, { itemId: 'stick', count: 2 }],
    description: 'Swiftly clears timber canopies',
  },
  {
    id: 'craft_sword_iron',
    name: 'Iron Sword',
    category: 'tools',
    resultId: 'sword_iron',
    resultCount: 1,
    requires: [{ itemId: 'iron_ingot', count: 2 }, { itemId: 'stick', count: 1 }],
    description: 'Hardened iron weapon for exploration',
  },
  {
    id: 'craft_sword_diamond',
    name: 'Diamond Sword',
    category: 'tools',
    resultId: 'sword_diamond',
    resultCount: 1,
    requires: [{ itemId: 'diamond', count: 2 }, { itemId: 'stick', count: 1 }],
    description: 'Devastating blade of crystal sharp steel',
  },
];

// Map from BlockType to dropped item ID
export function blockTypeToItemId(block: BlockType): string {
  switch (block) {
    case BlockType.GRASS: return 'dirt';
    case BlockType.DIRT: return 'dirt';
    case BlockType.STONE: return 'cobblestone';
    case BlockType.COBBLESTONE: return 'cobblestone';
    case BlockType.WOOD: return 'wood';
    case BlockType.PLANKS: return 'planks';
    case BlockType.LEAVES: return 'leaves';
    case BlockType.SAND: return 'sand';
    case BlockType.GLASS: return 'glass';
    case BlockType.BRICK: return 'brick';
    case BlockType.STONE_BRICKS: return 'stone_bricks';
    case BlockType.TORCH: return 'torch';
    case BlockType.CRAFTING_TABLE: return 'crafting_table';
    case BlockType.BOOKSHELF: return 'bookshelf';
    case BlockType.COAL_ORE: return 'coal';
    case BlockType.IRON_ORE: return 'iron_ingot';
    case BlockType.GOLD_ORE: return 'gold_ingot';
    case BlockType.DIAMOND_ORE: return 'diamond';
    default: return 'dirt';
  }
}

export class PlayerInventory {
  hotbar: (InventorySlot | null)[] = new Array(9).fill(null);
  backpack: (InventorySlot | null)[] = new Array(27).fill(null);
  selectedSlot = 0;
  private saveKey = 'pixel_sandbox_3d_inventory';

  constructor() {
    this.loadSaved();
  }

  private loadSaved(): void {
    try {
      const data = localStorage.getItem(this.saveKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.hotbar)) this.hotbar = parsed.hotbar;
        if (Array.isArray(parsed.backpack)) this.backpack = parsed.backpack;
        if (typeof parsed.selectedSlot === 'number') this.selectedSlot = parsed.selectedSlot;
        return;
      }
    } catch {
      // LocalStorage unavailable
    }

    // Default starter kit
    this.hotbar[0] = { itemId: 'pickaxe_wood', count: 1 };
    this.hotbar[1] = { itemId: 'planks', count: 32 };
    this.hotbar[2] = { itemId: 'cobblestone', count: 24 };
    this.hotbar[3] = { itemId: 'torch', count: 16 };
    this.hotbar[4] = { itemId: 'glass', count: 12 };
    this.hotbar[5] = { itemId: 'crafting_table', count: 1 };
    this.hotbar[6] = { itemId: 'leaves', count: 16 };
    this.hotbar[7] = { itemId: 'brick', count: 16 };
    this.hotbar[8] = { itemId: 'bookshelf', count: 4 };

    // Starter backpack items
    this.backpack[0] = { itemId: 'wood', count: 12 };
    this.backpack[1] = { itemId: 'dirt', count: 20 };
    this.backpack[2] = { itemId: 'sand', count: 16 };
    this.backpack[3] = { itemId: 'coal', count: 8 };
    this.backpack[4] = { itemId: 'iron_ingot', count: 4 };
  }

  save(): void {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify({
        hotbar: this.hotbar,
        backpack: this.backpack,
        selectedSlot: this.selectedSlot,
      }));
    } catch {
      // Ignore
    }
  }

  reset(): void {
    try {
      localStorage.removeItem(this.saveKey);
    } catch {
      // Ignore
    }
    this.loadSaved();
  }

  // Get active item in hotbar
  getActiveSheetItem(): InventorySlot | null {
    return this.hotbar[this.selectedSlot];
  }

  // Add item to inventory (fills hotbar first, then backpack)
  addItem(itemId: string, count = 1): number {
    const def = ITEM_DEFS[itemId];
    if (!def) return count;

    let remaining = count;

    // 1. Try stacking into existing non-full slots in hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.itemId === itemId && slot.count < def.maxStack) {
        const canAdd = Math.min(remaining, def.maxStack - slot.count);
        slot.count += canAdd;
        remaining -= canAdd;
        if (remaining <= 0) {
          this.save();
          return 0;
        }
      }
    }

    // 2. Try stacking into existing non-full slots in backpack
    for (let i = 0; i < this.backpack.length; i++) {
      const slot = this.backpack[i];
      if (slot && slot.itemId === itemId && slot.count < def.maxStack) {
        const canAdd = Math.min(remaining, def.maxStack - slot.count);
        slot.count += canAdd;
        remaining -= canAdd;
        if (remaining <= 0) {
          this.save();
          return 0;
        }
      }
    }

    // 3. Place into empty hotbar slot
    for (let i = 0; i < this.hotbar.length; i++) {
      if (this.hotbar[i] === null) {
        const toAdd = Math.min(remaining, def.maxStack);
        this.hotbar[i] = { itemId, count: toAdd };
        remaining -= toAdd;
        if (remaining <= 0) {
          this.save();
          return 0;
        }
      }
    }

    // 4. Place into empty backpack slot
    for (let i = 0; i < this.backpack.length; i++) {
      if (this.backpack[i] === null) {
        const toAdd = Math.min(remaining, def.maxStack);
        this.backpack[i] = { itemId, count: toAdd };
        remaining -= toAdd;
        if (remaining <= 0) {
          this.save();
          return 0;
        }
      }
    }

    this.save();
    return remaining; // unadded amount if inventory full
  }

  // Consume 1 item from active slot (e.g. when placing block)
  consumeActiveItem(): boolean {
    const slot = this.hotbar[this.selectedSlot];
    if (!slot) return false;
    slot.count -= 1;
    if (slot.count <= 0) {
      this.hotbar[this.selectedSlot] = null;
    }
    this.save();
    return true;
  }

  // Check how many of an item the player has in total
  countItem(itemId: string): number {
    let total = 0;
    for (const slot of this.hotbar) {
      if (slot && slot.itemId === itemId) total += slot.count;
    }
    for (const slot of this.backpack) {
      if (slot && slot.itemId === itemId) total += slot.count;
    }
    return total;
  }

  // Check if player has required recipe items
  canCraft(recipe: CraftingRecipe): boolean {
    for (const req of recipe.requires) {
      if (this.countItem(req.itemId) < req.count) return false;
    }
    return true;
  }

  // Craft a recipe
  craft(recipe: CraftingRecipe): boolean {
    if (!this.canCraft(recipe)) return false;

    // Deduct ingredients
    for (const req of recipe.requires) {
      let needed = req.count;

      // Deduct from hotbar first
      for (let i = 0; i < this.hotbar.length && needed > 0; i++) {
        const slot = this.hotbar[i];
        if (slot && slot.itemId === req.itemId) {
          const deduct = Math.min(needed, slot.count);
          slot.count -= deduct;
          needed -= deduct;
          if (slot.count <= 0) this.hotbar[i] = null;
        }
      }

      // Deduct from backpack
      for (let i = 0; i < this.backpack.length && needed > 0; i++) {
        const slot = this.backpack[i];
        if (slot && slot.itemId === req.itemId) {
          const deduct = Math.min(needed, slot.count);
          slot.count -= deduct;
          needed -= deduct;
          if (slot.count <= 0) this.backpack[i] = null;
        }
      }
    }

    // Add crafted result
    this.addItem(recipe.resultId, recipe.resultCount);
    this.save();
    return true;
  }
}
