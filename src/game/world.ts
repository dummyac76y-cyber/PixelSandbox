// ============================================================
// WORLD - Tilemap data, areas, interactive objects
// ============================================================
import { TileType, AreaId, TILE_SIZE, Rect, aabbOverlap } from './constants';

// Tile collision properties
export function isSolid(tile: TileType): boolean {
  return tile === TileType.WALL || tile === TileType.WATER || tile === TileType.TREE ||
    tile === TileType.HOUSE_WALL || tile === TileType.ROOF || tile === TileType.FENCE ||
    tile === TileType.PILLAR || tile === TileType.BOSS_DOOR;
}

export function isDamage(tile: TileType): boolean {
  return tile === TileType.SPIKE;
}

// Map dimensions
export const VILLAGE_W = 48;
export const VILLAGE_H = 32;
export const WOODS_W = 48;
export const WOODS_H = 32;
export const RUINS_W = 48;
export const RUINS_H = 32;
export const BOSS_W = 24;
export const BOSS_H = 24;
export const HOUSE_W = 16;
export const HOUSE_H = 12;

// Generate village map
function generateVillage(): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < VILLAGE_H; y++) {
    map[y] = [];
    for (let x = 0; x < VILLAGE_W; x++) {
      // Default grass
      map[y][x] = TileType.GRASS;
      // Border walls
      if (y === 0 || y === VILLAGE_H - 1 || x === 0 || x === VILLAGE_W - 1) {
        map[y][x] = TileType.FENCE;
      }
    }
  }

  // Paths (horizontal and vertical)
  for (let x = 2; x < VILLAGE_W - 2; x++) {
    map[16][x] = TileType.PATH;
    map[17][x] = TileType.PATH;
  }
  for (let y = 4; y < VILLAGE_H - 4; y++) {
    map[y][24] = TileType.PATH;
    map[y][25] = TileType.PATH;
  }

  // Houses
  // House 1 (Elder's house) - top left
  for (let y = 4; y < 9; y++) {
    for (let x = 5; x < 12; x++) {
      if (y === 4) map[y][x] = TileType.ROOF;
      else if (y === 5) map[y][x] = TileType.ROOF;
      else map[y][x] = TileType.HOUSE_WALL;
    }
  }
  map[8][8] = TileType.DOOR; // Elder's house door

  // House 2 (Merchant) - top right
  for (let y = 4; y < 9; y++) {
    for (let x = 30; x < 37; x++) {
      if (y === 4) map[y][x] = TileType.ROOF;
      else if (y === 5) map[y][x] = TileType.ROOF;
      else map[y][x] = TileType.HOUSE_WALL;
    }
  }
  map[8][33] = TileType.DOOR;

  // House 3 (Villager) - bottom left
  for (let y = 20; y < 25; y++) {
    for (let x = 5; x < 12; x++) {
      if (y === 20) map[y][x] = TileType.ROOF;
      else if (y === 21) map[y][x] = TileType.ROOF;
      else map[y][x] = TileType.HOUSE_WALL;
    }
  }
  map[24][8] = TileType.DOOR;

  // Fences around village
  for (let x = 3; x < 15; x++) {
    map[10][x] = TileType.FENCE;
  }
  for (let x = 28; x < 40; x++) {
    map[10][x] = TileType.FENCE;
  }

  // Exit to woods (right side)
  map[16][VILLAGE_W - 1] = TileType.PATH;
  map[17][VILLAGE_W - 1] = TileType.PATH;

  // Water feature
  for (let y = 22; y < 28; y++) {
    for (let x = 35; x < 42; x++) {
      map[y][x] = TileType.WATER;
    }
  }

  return map;
}

// Generate woods map
function generateWoods(): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < WOODS_H; y++) {
    map[y] = [];
    for (let x = 0; x < WOODS_W; x++) {
      map[y][x] = TileType.GRASS;
      if (y === 0 || y === WOODS_H - 1 || x === 0 || x === WOODS_W - 1) {
        map[y][x] = TileType.TREE;
      }
    }
  }

  // Path from village (left side)
  for (let x = 0; x < 20; x++) {
    map[16][x] = TileType.PATH;
    map[17][x] = TileType.PATH;
  }

  // Winding path through woods
  for (let x = 20; x < 35; x++) {
    const yOff = Math.floor(Math.sin(x * 0.3) * 3);
    map[16 + yOff][x] = TileType.PATH;
    map[17 + yOff][x] = TileType.PATH;
  }

  // Path to ruins (right side)
  for (let x = 35; x < WOODS_W; x++) {
    map[16][x] = TileType.PATH;
    map[17][x] = TileType.PATH;
  }

  // Scatter trees
  const treePositions = [
    [3, 3], [5, 7], [8, 4], [12, 6], [15, 3], [18, 8],
    [22, 5], [25, 10], [28, 4], [32, 7], [35, 3], [38, 9],
    [4, 12], [7, 20], [10, 24], [14, 22], [20, 25], [25, 22],
    [30, 24], [35, 20], [40, 15], [42, 8], [44, 12], [6, 27],
    [12, 28], [20, 28], [30, 28], [38, 26], [43, 22],
  ];
  for (const [x, y] of treePositions) {
    if (x < WOODS_W && y < WOODS_H && map[y][x] === TileType.GRASS) {
      map[y][x] = TileType.TREE;
    }
  }

  // Bushes (breakable)
  const bushPositions = [
    [10, 14], [10, 15], [16, 10], [16, 11], [22, 14],
    [28, 20], [34, 14], [34, 15], [40, 18],
  ];
  for (const [x, y] of bushPositions) {
    if (x < WOODS_W && y < WOODS_H && map[y][x] === TileType.GRASS) {
      map[y][x] = TileType.BUSH;
    }
  }

  // Entry from village (left)
  map[16][0] = TileType.PATH;
  map[17][0] = TileType.PATH;

  return map;
}

// Generate ruins map
function generateRuins(): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < RUINS_H; y++) {
    map[y] = [];
    for (let x = 0; x < RUINS_W; x++) {
      map[y][x] = TileType.FLOOR_STONE;
      // Border walls
      if (y === 0 || y === RUINS_H - 1 || x === 0 || x === RUINS_W - 1) {
        map[y][x] = TileType.WALL;
      }
    }
  }

  // Entry from woods (left side)
  map[16][0] = TileType.FLOOR_STONE;
  map[17][0] = TileType.FLOOR_STONE;

  // Internal walls creating rooms
  // Room 1: Entry room
  for (let y = 8; y < 24; y++) {
    map[y][12] = TileType.WALL;
  }
  map[16][12] = TileType.FLOOR_STONE; // Doorway

  // Room 2: Middle room with spikes
  for (let y = 4; y < 28; y++) {
    map[y][24] = TileType.WALL;
  }
  map[16][24] = TileType.FLOOR_STONE; // Doorway

  // Room 3: Key room
  for (let y = 8; y < 24; y++) {
    map[y][36] = TileType.WALL;
  }
  map[12][36] = TileType.FLOOR_STONE; // Doorway

  // Pillars in rooms
  const pillarPositions = [
    [4, 4], [8, 4], [4, 12], [8, 12], [4, 20], [8, 20],
    [16, 8], [20, 8], [16, 16], [20, 16], [16, 24], [20, 24],
    [28, 4], [32, 4], [28, 12], [32, 12], [28, 20], [32, 20],
    [40, 8], [44, 8], [40, 16], [44, 16],
  ];
  for (const [x, y] of pillarPositions) {
    if (x < RUINS_W && y < RUINS_H && map[y][x] === TileType.FLOOR_STONE) {
      map[y][x] = TileType.PILLAR;
    }
  }

  // Spike traps (toggle on/off)
  const spikePositions = [
    [15, 10], [15, 11], [15, 12], [18, 20], [18, 21], [18, 22],
    [27, 8], [27, 9], [30, 18], [30, 19],
  ];
  for (const [x, y] of spikePositions) {
    if (x < RUINS_W && y < RUINS_H && map[y][x] === TileType.FLOOR_STONE) {
      map[y][x] = TileType.SPIKE;
    }
  }

  // Boss door (top of map, room 3)
  map[1][42] = TileType.BOSS_DOOR;
  map[1][43] = TileType.BOSS_DOOR;

  return map;
}

// Generate boss arena
function generateBossArena(): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < BOSS_H; y++) {
    map[y] = [];
    for (let x = 0; x < BOSS_W; x++) {
      map[y][x] = TileType.FLOOR_STONE;
      if (y === 0 || y === BOSS_H - 1 || x === 0 || x === BOSS_W - 1) {
        map[y][x] = TileType.WALL;
      }
    }
  }

  // Some pillars for cover
  const pillars = [[4, 4], [4, 19], [19, 4], [19, 19], [12, 12]];
  for (const [x, y] of pillars) {
    map[y][x] = TileType.PILLAR;
  }

  // Entry at bottom
  map[BOSS_H - 1][12] = TileType.FLOOR_STONE;

  return map;
}

// Generate house interior
function generateHouse(): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < HOUSE_H; y++) {
    map[y] = [];
    for (let x = 0; x < HOUSE_W; x++) {
      map[y][x] = TileType.FLOOR_WOOD;
      if (y === 0 || y === HOUSE_H - 1 || x === 0 || x === HOUSE_W - 1) {
        map[y][x] = TileType.HOUSE_WALL;
      }
    }
  }
  // Door at bottom
  map[HOUSE_H - 1][8] = TileType.DOOR;
  return map;
}

// ============================================================
// AREA DEFINITIONS
// ============================================================
export interface AreaData {
  id: AreaId;
  map: TileType[][];
  width: number;
  height: number;
  music: string;
  enemies: EnemySpawn[];
  npcs: NPCSpawn[];
  chests: ChestSpawn[];
  signs: SignSpawn[];
  exits: ExitData[];
  playerSpawn: { x: number; y: number };
}

export interface EnemySpawn {
  type: string;
  x: number;
  y: number;
}

export interface NPCSpawn {
  type: string;
  x: number;
  y: number;
  name: string;
}

export interface ChestSpawn {
  id: string;
  x: number;
  y: number;
  item: string;
}

export interface SignSpawn {
  x: number;
  y: number;
  text: string;
}

export interface ExitData {
  x: number;
  y: number;
  w: number;
  h: number;
  targetArea: AreaId;
  targetX: number;
  targetY: number;
  requiresKey?: boolean;
}

export function createAreas(): Map<AreaId, AreaData> {
  const areas = new Map<AreaId, AreaData>();

  areas.set(AreaId.VILLAGE, {
    id: AreaId.VILLAGE,
    map: generateVillage(),
    width: VILLAGE_W,
    height: VILLAGE_H,
    music: 'village',
    enemies: [],
    npcs: [
      { type: 'npc_elder', x: 8 * 16, y: 9 * 16, name: 'Elder Morin' },
      { type: 'npc_merchant', x: 33 * 16, y: 9 * 16, name: 'Merchant Gill' },
      { type: 'npc_villager', x: 8 * 16, y: 25 * 16, name: 'Villager Pip' },
    ],
    chests: [],
    signs: [
      { x: 24 * 16, y: 14 * 16, text: 'Welcome to Hearthvale!\nThe woods to the east hold dark secrets...' },
      { x: 15 * 16, y: 16 * 16, text: 'East → Whispering Woods' },
    ],
    exits: [
      { x: (VILLAGE_W - 1) * 16, y: 16 * 16, w: 16, h: 32, targetArea: AreaId.WOODS, targetX: 2 * 16, targetY: 16 * 16 },
    ],
    playerSpawn: { x: 24 * 16, y: 18 * 16 },
  });

  areas.set(AreaId.WOODS, {
    id: AreaId.WOODS,
    map: generateWoods(),
    width: WOODS_W,
    height: WOODS_H,
    music: 'woods',
    enemies: [
      { type: 'SWARMER', x: 15 * 16, y: 12 * 16 },
      { type: 'SWARMER', x: 20 * 16, y: 20 * 16 },
      { type: 'SWARMER', x: 25 * 16, y: 14 * 16 },
      { type: 'SWARMER', x: 30 * 16, y: 18 * 16 },
      { type: 'SWARMER', x: 35 * 16, y: 12 * 16 },
      { type: 'SWARMER', x: 22 * 16, y: 8 * 16 },
      { type: 'SWARMER', x: 28 * 16, y: 24 * 16 },
    ],
    npcs: [],
    chests: [
      { id: 'woods_chest1', x: 40 * 16, y: 6 * 16, item: 'health_potion' },
    ],
    signs: [
      { x: 5 * 16, y: 16 * 16, text: 'West → Hearthvale Village' },
      { x: 42 * 16, y: 16 * 16, text: 'East → Ancient Ruins\nBeware the monsters within!' },
    ],
    exits: [
      { x: 0, y: 16 * 16, w: 16, h: 32, targetArea: AreaId.VILLAGE, targetX: (VILLAGE_W - 3) * 16, targetY: 16 * 16 },
      { x: (WOODS_W - 1) * 16, y: 16 * 16, w: 16, h: 32, targetArea: AreaId.RUINS, targetX: 2 * 16, targetY: 16 * 16 },
    ],
    playerSpawn: { x: 2 * 16, y: 16 * 16 },
  });

  areas.set(AreaId.RUINS, {
    id: AreaId.RUINS,
    map: generateRuins(),
    width: RUINS_W,
    height: RUINS_H,
    music: 'ruins',
    enemies: [
      { type: 'CHARGER', x: 16 * 16, y: 10 * 16 },
      { type: 'CHARGER', x: 20 * 16, y: 20 * 16 },
      { type: 'BRUTE', x: 28 * 16, y: 14 * 16 },
      { type: 'CHARGER', x: 32 * 16, y: 8 * 16 },
      { type: 'BRUTE', x: 40 * 16, y: 14 * 16 },
    ],
    npcs: [],
    chests: [
      { id: 'ruins_key_chest', x: 44 * 16, y: 10 * 16, item: 'dungeon_key' },
      { id: 'ruins_chest2', x: 6 * 16, y: 26 * 16, item: 'sword_2' },
    ],
    signs: [
      { x: 3 * 16, y: 16 * 16, text: 'The Ancient Ruins\nDanger lurks in every shadow...' },
    ],
    exits: [
      { x: 0, y: 16 * 16, w: 16, h: 32, targetArea: AreaId.WOODS, targetX: (WOODS_W - 3) * 16, targetY: 16 * 16 },
      { x: 42 * 16, y: 0, w: 32, h: 16, targetArea: AreaId.BOSS_ARENA, targetX: 12 * 16, targetY: (BOSS_H - 3) * 16, requiresKey: true },
    ],
    playerSpawn: { x: 2 * 16, y: 16 * 16 },
  });

  areas.set(AreaId.BOSS_ARENA, {
    id: AreaId.BOSS_ARENA,
    map: generateBossArena(),
    width: BOSS_W,
    height: BOSS_H,
    music: 'boss',
    enemies: [
      { type: 'BOSS', x: 12 * 16, y: 6 * 16 },
    ],
    npcs: [],
    chests: [],
    signs: [],
    exits: [
      { x: 12 * 16, y: (BOSS_H - 1) * 16, w: 16, h: 16, targetArea: AreaId.RUINS, targetX: 42 * 16, targetY: 2 * 16 },
    ],
    playerSpawn: { x: 12 * 16, y: (BOSS_H - 3) * 16 },
  });

  areas.set(AreaId.VILLAGE_HOUSE, {
    id: AreaId.VILLAGE_HOUSE,
    map: generateHouse(),
    width: HOUSE_W,
    height: HOUSE_H,
    music: 'village',
    enemies: [],
    npcs: [],
    chests: [
      { id: 'house_chest1', x: 3 * 16, y: 3 * 16, item: 'health_potion' },
    ],
    signs: [],
    exits: [
      { x: 8 * 16, y: (HOUSE_H - 1) * 16, w: 16, h: 16, targetArea: AreaId.VILLAGE, targetX: 8 * 16, targetY: 9 * 16 },
    ],
    playerSpawn: { x: 8 * 16, y: 8 * 16 },
  });

  return areas;
}

// ============================================================
// WORLD CLASS - Handles tile queries and collision
// ============================================================
export class World {
  areas: Map<AreaId, AreaData>;
  currentArea: AreaId = AreaId.VILLAGE;
  spikeTimer = 0;
  spikeActive = false;
  brokenBushes: Set<string> = new Set();
  openedChests: Set<string> = new Set();

  constructor() {
    this.areas = createAreas();
  }

  getArea(): AreaData {
    return this.areas.get(this.currentArea)!;
  }

  getTile(x: number, y: number): TileType {
    const area = this.getArea();
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= area.width || ty >= area.height) {
      return TileType.WALL;
    }
    return area.map[ty][tx];
  }

  isSolidAt(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (tile === TileType.BUSH) {
      const key = `${this.currentArea}_${Math.floor(x / TILE_SIZE)}_${Math.floor(y / TILE_SIZE)}`;
      if (this.brokenBushes.has(key)) return false;
      return true;
    }
    if (tile === TileType.BOSS_DOOR) {
      // Check if player has key
      return true; // Will be handled by exit logic
    }
    return isSolid(tile);
  }

  isSpikeActive(): boolean {
    return this.spikeActive;
  }

  isDamageAt(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (tile === TileType.SPIKE && this.spikeActive) return true;
    return false;
  }

  update(): void {
    this.spikeTimer++;
    // Spike toggle every 90 ticks (1.5 seconds)
    if (this.spikeTimer >= 90) {
      this.spikeTimer = 0;
      this.spikeActive = !this.spikeActive;
    }
  }

  breakBush(tx: number, ty: number): void {
    const key = `${this.currentArea}_${tx}_${ty}`;
    this.brokenBushes.add(key);
  }

  isBushBroken(tx: number, ty: number): boolean {
    const key = `${this.currentArea}_${tx}_${ty}`;
    return this.brokenBushes.has(key);
  }

  // Check collision for a rectangle against tiles
  checkCollision(rect: Rect): boolean {
    // Check all four corners and midpoints
    const points = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.w - 1, y: rect.y },
      { x: rect.x, y: rect.y + rect.h - 1 },
      { x: rect.x + rect.w - 1, y: rect.y + rect.h - 1 },
      { x: rect.x + rect.w / 2, y: rect.y },
      { x: rect.x + rect.w / 2, y: rect.y + rect.h - 1 },
      { x: rect.x, y: rect.y + rect.h / 2 },
      { x: rect.x + rect.w - 1, y: rect.y + rect.h / 2 },
    ];
    for (const p of points) {
      if (this.isSolidAt(p.x, p.y)) return true;
    }
    return false;
  }

  // Resolve collision on X axis
  resolveX(rect: Rect, vx: number): number {
    if (vx === 0) return rect.x;
    const testRect = { ...rect, x: rect.x + vx };
    if (!this.checkCollision(testRect)) {
      return rect.x + vx;
    }
    // Nudge to edge
    if (vx > 0) {
      const tileRight = Math.floor((rect.x + rect.w + vx) / TILE_SIZE);
      return tileRight * TILE_SIZE - rect.w;
    } else {
      const tileLeft = Math.floor((rect.x + vx) / TILE_SIZE);
      return (tileLeft + 1) * TILE_SIZE;
    }
  }

  // Resolve collision on Y axis
  resolveY(rect: Rect, vy: number): number {
    if (vy === 0) return rect.y;
    const testRect = { ...rect, y: rect.y + vy };
    if (!this.checkCollision(testRect)) {
      return rect.y + vy;
    }
    if (vy > 0) {
      const tileBottom = Math.floor((rect.y + rect.h + vy) / TILE_SIZE);
      return tileBottom * TILE_SIZE - rect.h;
    } else {
      const tileTop = Math.floor((rect.y + vy) / TILE_SIZE);
      return (tileTop + 1) * TILE_SIZE;
    }
  }

  // Check exits
  checkExit(rect: Rect): ExitData | null {
    const area = this.getArea();
    for (const exit of area.exits) {
      const exitRect: Rect = { x: exit.x, y: exit.y, w: exit.w, h: exit.h };
      if (aabbOverlap(rect, exitRect)) {
        return exit;
      }
    }
    return null;
  }
}
