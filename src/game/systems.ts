// ============================================================
// SYSTEMS - Items, Inventory, Quests, Save/Load
// ============================================================
import { Item, ItemType, Quest, QuestObjective, SaveData, AreaId } from './constants';

// ============================================================
// ITEM DEFINITIONS
// ============================================================
export const ITEMS: Record<string, Item> = {
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 3 HP',
    icon: 'icon_potion',
    type: ItemType.CONSUMABLE,
    stackLimit: 5,
    value: 10,
    healAmount: 3,
  },
  sword_1: {
    id: 'sword_1',
    name: 'Iron Sword',
    description: 'A basic sword. Damage: 1',
    icon: 'icon_sword',
    type: ItemType.EQUIPMENT,
    stackLimit: 1,
    value: 0,
    damage: 1,
  },
  sword_2: {
    id: 'sword_2',
    name: 'Steel Blade',
    description: 'A sharper blade. Damage: 2',
    icon: 'icon_sword2',
    type: ItemType.EQUIPMENT,
    stackLimit: 1,
    value: 50,
    damage: 2,
  },
  sword_3: {
    id: 'sword_3',
    name: 'Flame Sword',
    description: 'Burns with fire. Damage: 3',
    icon: 'icon_sword2',
    type: ItemType.EQUIPMENT,
    stackLimit: 1,
    value: 120,
    damage: 3,
  },
  shield_1: {
    id: 'shield_1',
    name: 'Wooden Shield',
    description: 'Reduces damage by 1',
    icon: 'icon_shield',
    type: ItemType.EQUIPMENT,
    stackLimit: 1,
    value: 30,
    defense: 1,
  },
  dungeon_key: {
    id: 'dungeon_key',
    name: 'Dungeon Key',
    description: 'Opens the sealed door in the ruins',
    icon: 'icon_key',
    type: ItemType.KEY,
    stackLimit: 1,
    value: 0,
  },
  quest_crystal: {
    id: 'quest_crystal',
    name: 'Ancient Crystal',
    description: 'A mysterious crystal from the ruins',
    icon: 'icon_quest',
    type: ItemType.MATERIAL,
    stackLimit: 1,
    value: 0,
  },
  coin: {
    id: 'coin',
    name: 'Coin',
    description: 'Currency',
    icon: 'icon_coin',
    type: ItemType.MATERIAL,
    stackLimit: 999,
    value: 1,
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    description: 'Building material',
    icon: 'icon_wood',
    type: ItemType.MATERIAL,
    stackLimit: 99,
    value: 1,
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    description: 'Building material',
    icon: 'icon_stone',
    type: ItemType.MATERIAL,
    stackLimit: 99,
    value: 1,
  },
  leaves: {
    id: 'leaves',
    name: 'Leaves',
    description: 'Decorative blocks',
    icon: 'icon_leaves',
    type: ItemType.MATERIAL,
    stackLimit: 99,
    value: 1,
  },
};

// ============================================================
// INVENTORY
// ============================================================
export interface InventorySlot {
  itemId: string;
  count: number;
}

export class Inventory {
  slots: InventorySlot[] = [];
  maxSlots: number = 16;

  addItem(itemId: string, count: number = 1): boolean {
    const item = ITEMS[itemId];
    if (!item) return false;

    // Check if already in inventory
    const existing = this.slots.find(s => s.itemId === itemId);
    if (existing) {
      if (existing.count + count <= item.stackLimit) {
        existing.count += count;
        return true;
      }
    } else {
      if (this.slots.length < this.maxSlots) {
        this.slots.push({ itemId, count });
        return true;
      }
    }
    return false; // Inventory full or stack limit reached
  }

  removeItem(itemId: string, count: number = 1): boolean {
    const idx = this.slots.findIndex(s => s.itemId === itemId);
    if (idx === -1) return false;
    this.slots[idx].count -= count;
    if (this.slots[idx].count <= 0) {
      this.slots.splice(idx, 1);
    }
    return true;
  }

  hasItem(itemId: string, count: number = 1): boolean {
    const slot = this.slots.find(s => s.itemId === itemId);
    return slot !== undefined && slot.count >= count;
  }

  getCount(itemId: string): number {
    const slot = this.slots.find(s => s.itemId === itemId);
    return slot ? slot.count : 0;
  }

  serialize(): { itemId: string; count: number }[] {
    return this.slots.map(s => ({ ...s }));
  }

  deserialize(data: { itemId: string; count: number }[]): void {
    this.slots = data.map(s => ({ ...s }));
  }
}

// ============================================================
// QUEST MANAGER
// ============================================================
export class QuestManager {
  quests: Quest[] = [];
  currentQuestIndex: number = 0;
  choiceMade: string = ''; // 'power' or 'wisdom'
  onComplete: (() => void) | null = null;

  constructor() {
    this.quests = [
      {
        id: 'quest_1',
        title: 'The Elder\'s Request',
        description: 'Speak to Elder Morin in the village',
        objectives: [{ type: 'talk', target: 'elder', current: 0, max: 1 }],
        rewards: [],
        completed: false,
        active: true,
      },
      {
        id: 'quest_2',
        title: 'Clear the Woods',
        description: 'Defeat 5 slimes in the Whispering Woods',
        objectives: [{ type: 'kill', target: 'SWARMER', current: 0, max: 5 }],
        rewards: ['health_potion', 'health_potion'],
        completed: false,
        active: false,
      },
      {
        id: 'quest_3',
        title: 'The Dungeon Key',
        description: 'Find the dungeon key in the Ancient Ruins',
        objectives: [{ type: 'collect', target: 'dungeon_key', current: 0, max: 1 }],
        rewards: [],
        completed: false,
        active: false,
      },
      {
        id: 'quest_4',
        title: 'Defeat the Guardian',
        description: 'Defeat the Ruins Guardian in the Boss Arena',
        objectives: [{ type: 'kill', target: 'BOSS', current: 0, max: 1 }],
        rewards: ['quest_crystal'],
        completed: false,
        active: false,
      },
    ];
  }

  getCurrentQuest(): Quest | null {
    for (const q of this.quests) {
      if (q.active && !q.completed) return q;
    }
    return null;
  }

  getCurrentObjective(): QuestObjective | null {
    const quest = this.getCurrentQuest();
    if (!quest) return null;
    for (const obj of quest.objectives) {
      if (obj.current < obj.max) return obj;
    }
    return null;
  }

  progressObjective(type: string, target: string): void {
    const quest = this.getCurrentQuest();
    if (!quest) return;
    for (const obj of quest.objectives) {
      if (obj.type === type && obj.target === target && obj.current < obj.max) {
        obj.current++;
        if (obj.current >= obj.max) {
          this.checkQuestCompletion();
        }
        return;
      }
    }
  }

  private checkQuestCompletion(): void {
    const quest = this.getCurrentQuest();
    if (!quest) return;
    const allDone = quest.objectives.every(o => o.current >= o.max);
    if (allDone) {
      quest.completed = true;
      quest.active = false;
      // Activate next quest
      const idx = this.quests.indexOf(quest);
      if (idx < this.quests.length - 1) {
        this.quests[idx + 1].active = true;
        this.currentQuestIndex = idx + 1;
      }
      if (this.onComplete) this.onComplete();
    }
  }

  makeChoice(choice: string): void {
    this.choiceMade = choice;
  }

  serialize(): { id: string; completed: boolean; active: boolean; objectives: QuestObjective[] }[] {
    return this.quests.map(q => ({
      id: q.id,
      completed: q.completed,
      active: q.active,
      objectives: q.objectives.map(o => ({ ...o })),
    }));
  }

  deserialize(data: { id: string; completed: boolean; active: boolean; objectives: QuestObjective[] }[]): void {
    for (const saved of data) {
      const quest = this.quests.find(q => q.id === saved.id);
      if (quest) {
        quest.completed = saved.completed;
        quest.active = saved.active;
        quest.objectives = saved.objectives.map(o => ({ ...o }));
      }
    }
  }
}

// ============================================================
// SAVE MANAGER
// ============================================================
export class SaveManager {
  private storageKey = 'shadows_of_ruins_save';
  private settingsKey = 'shadows_of_ruins_settings';
  private useLocalStorage: boolean = true;
  private memoryStorage: Record<string, string> = {};

  constructor() {
    // Test localStorage availability
    try {
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
    } catch (e) {
      this.useLocalStorage = false;
      console.warn('localStorage unavailable, using in-memory storage');
    }
  }

  save(data: SaveData): boolean {
    try {
      const json = JSON.stringify(data);
      if (this.useLocalStorage) {
        localStorage.setItem(this.storageKey, json);
      } else {
        this.memoryStorage[this.storageKey] = json;
      }
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  load(): SaveData | null {
    try {
      let json: string | null = null;
      if (this.useLocalStorage) {
        json = localStorage.getItem(this.storageKey);
      } else {
        json = this.memoryStorage[this.storageKey] || null;
      }
      if (!json) return null;

      const data = JSON.parse(json) as SaveData;
      // Validate
      if (!data.version || !data.currentArea || typeof data.hp !== 'number') {
        console.warn('Invalid save data, discarding');
        return null;
      }
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  hasSave(): boolean {
    try {
      if (this.useLocalStorage) {
        return localStorage.getItem(this.storageKey) !== null;
      }
      return !!this.memoryStorage[this.storageKey];
    } catch (e) {
      return false;
    }
  }

  deleteSave(): void {
    try {
      if (this.useLocalStorage) {
        localStorage.removeItem(this.storageKey);
      } else {
        delete this.memoryStorage[this.storageKey];
      }
    } catch (e) {
      // Ignore
    }
  }

  // Settings (separate from save data)
  saveSettings(settings: Record<string, any>): void {
    try {
      const json = JSON.stringify(settings);
      if (this.useLocalStorage) {
        localStorage.setItem(this.settingsKey, json);
      } else {
        this.memoryStorage[this.settingsKey] = json;
      }
    } catch (e) {
      // Ignore
    }
  }

  loadSettings(): Record<string, any> | null {
    try {
      let json: string | null = null;
      if (this.useLocalStorage) {
        json = localStorage.getItem(this.settingsKey);
      } else {
        json = this.memoryStorage[this.settingsKey] || null;
      }
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }
}

// ============================================================
// SHOP DATA
// ============================================================
export interface ShopItem {
  itemId: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { itemId: 'health_potion', price: 10 },
  { itemId: 'sword_2', price: 50 },
  { itemId: 'shield_1', price: 30 },
];
