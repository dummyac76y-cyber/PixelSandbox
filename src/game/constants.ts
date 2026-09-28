// ============================================================
// CONSTANTS & TYPES - Core definitions for the game
// ============================================================

// PICO-8 16-color palette
export const PALETTE = {
  black: '#000000',
  darkBlue: '#1D2B53',
  darkPurple: '#7E2553',
  darkGreen: '#008751',
  brown: '#AB5236',
  darkGray: '#5F574F',
  lightGray: '#C2C3C7',
  white: '#FFF1E8',
  red: '#FF004D',
  orange: '#FFA300',
  yellow: '#FFEC27',
  green: '#00E436',
  blue: '#29ADFF',
  indigo: '#83769C',
  pink: '#FF77A8',
  peach: '#FFCCAA',
} as const;

export const PALETTE_ARRAY = Object.values(PALETTE);

// Internal resolution
export const INTERNAL_W = 384;
export const INTERNAL_H = 216;
export const TILE_SIZE = 16;
export const FIXED_DT = 1000 / 60; // ~16.67ms per tick

// Game states
export enum GameState {
  BOOT = 'BOOT',
  MAIN_MENU = 'MAIN_MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  INVENTORY = 'INVENTORY',
  DIALOGUE = 'DIALOGUE',
  TRANSITION = 'TRANSITION',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  SETTINGS = 'SETTINGS',
  SHOP = 'SHOP',
}

// Player states
export enum PlayerState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  ATTACK = 'ATTACK',
  HURT = 'HURT',
  DEATH = 'DEATH',
  INTERACT = 'INTERACT',
  JUMP = 'JUMP',
}

// Enemy states
export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  TELEGRAPH = 'TELEGRAPH',
  ATTACK = 'ATTACK',
  HURT = 'HURT',
  DEAD = 'DEAD',
}

// Directions
export enum Dir {
  DOWN = 0,
  UP = 1,
  LEFT = 2,
  RIGHT = 3,
}

// Enemy types
export enum EnemyType {
  SWARMER = 'SWARMER',
  CHARGER = 'CHARGER',
  BRUTE = 'BRUTE',
  BOSS = 'BOSS',
}

// Item types
export enum ItemType {
  CONSUMABLE = 'CONSUMABLE',
  EQUIPMENT = 'EQUIPMENT',
  KEY = 'KEY',
  MATERIAL = 'MATERIAL',
}

// Tile types
export enum TileType {
  EMPTY = 0,
  GRASS = 1,
  PATH = 2,
  WALL = 3,
  WATER = 4,
  TREE = 5,
  FLOOR_STONE = 6,
  FLOOR_WOOD = 7,
  DOOR = 8,
  SPIKE = 9,
  BUSH = 10,
  FENCE = 11,
  CHEST = 12,
  SIGN = 13,
  HOUSE_WALL = 14,
  ROOF = 15,
  PILLAR = 16,
  BOSS_DOOR = 17,
}

// Area IDs
export enum AreaId {
  VILLAGE = 'VILLAGE',
  WOODS = 'WOODS',
  RUINS = 'RUINS',
  BOSS_ARENA = 'BOSS_ARENA',
  VILLAGE_HOUSE = 'VILLAGE_HOUSE',
}

// Interfaces
export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ItemType;
  stackLimit: number;
  value: number;
  damage?: number;
  defense?: number;
  healAmount?: number;
}

export interface QuestObjective {
  type: 'kill' | 'collect' | 'talk' | 'reach';
  target: string;
  current: number;
  max: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: string[];
  completed: boolean;
  active: boolean;
}

export interface SaveData {
  version: number;
  playerX: number;
  playerY: number;
  currentArea: AreaId;
  hp: number;
  maxHp: number;
  coins: number;
  inventory: { itemId: string; count: number }[];
  equippedWeapon: string;
  equippedShield: string;
  quests: { id: string; completed: boolean; active: boolean; objectives: QuestObjective[] }[];
  choiceFlags: Record<string, string>;
  openedChests: string[];
  defeatedBoss: boolean;
  hasKey: boolean;
}

// Utility functions
export function aabbOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function dirToVec(dir: Dir): Vec2 {
  switch (dir) {
    case Dir.DOWN: return { x: 0, y: 1 };
    case Dir.UP: return { x: 0, y: -1 };
    case Dir.LEFT: return { x: -1, y: 0 };
    case Dir.RIGHT: return { x: 1, y: 0 };
  }
}
