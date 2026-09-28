// ============================================================
// WORLD - Infinite sandbox with chunk-based generation
// ============================================================
import { TileType, TILE_SIZE, Rect } from './constants';

// Chunk size
export const CHUNK_SIZE = 16;

// Simple seeded random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Simple 2D noise using hash
function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

// Smooth noise interpolation
function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smooth interpolation
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

// Multi-octave noise
function noise(x: number, y: number, seed: number, octaves: number = 3): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, y * frequency, seed + i * 1000) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

// Chunk data
export interface Chunk {
  x: number;
  y: number;
  tiles: TileType[][];
  generated: boolean;
}

// Tile collision properties
export function isSolid(tile: TileType): boolean {
  return tile === TileType.WALL || tile === TileType.WATER || tile === TileType.TREE ||
    tile === TileType.HOUSE_WALL || tile === TileType.ROOF || tile === TileType.FENCE ||
    tile === TileType.PILLAR || tile === TileType.BOSS_DOOR || tile === TileType.BUSH;
}

export function isBreakable(tile: TileType): boolean {
  return tile === TileType.TREE || tile === TileType.BUSH || tile === TileType.WALL ||
    tile === TileType.FENCE || tile === TileType.PILLAR;
}

export function tileToItem(tile: TileType): string | null {
  switch (tile) {
    case TileType.TREE: return 'wood';
    case TileType.BUSH: return 'leaves';
    case TileType.WALL: return 'stone';
    case TileType.FENCE: return 'wood';
    case TileType.PILLAR: return 'stone';
    default: return null;
  }
}

export function itemToTile(itemId: string): TileType | null {
  switch (itemId) {
    case 'wood': return TileType.FENCE;
    case 'stone': return TileType.WALL;
    case 'leaves': return TileType.BUSH;
    default: return null;
  }
}

// ============================================================
// WORLD CLASS - Infinite chunk-based world
// ============================================================
export class World {
  chunks: Map<string, Chunk> = new Map();
  modifications: Map<string, TileType> = new Map(); // "x,y" -> tileType (null means removed)
  seed: number;
  spikeTimer: number = 0;
  spikeActive: boolean = false;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  getChunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  // Generate a chunk
  generateChunk(cx: number, cy: number): Chunk {
    const key = this.getChunkKey(cx, cy);
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }

    const chunk: Chunk = {
      x: cx,
      y: cy,
      tiles: [],
      generated: true,
    };

    // Generate tiles
    for (let y = 0; y < CHUNK_SIZE; y++) {
      chunk.tiles[y] = [];
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const worldX = cx * CHUNK_SIZE + x;
        const worldY = cy * CHUNK_SIZE + y;

        // Base terrain using noise
        const elevation = noise(worldX * 0.05, worldY * 0.05, this.seed, 3);
        const moisture = noise(worldX * 0.08, worldY * 0.08, this.seed + 1000, 2);
        const detail = noise(worldX * 0.2, worldY * 0.2, this.seed + 2000, 2);

        let tile = TileType.GRASS;

        // Water in low areas
        if (elevation < 0.3) {
          tile = TileType.WATER;
        }
        // Paths in medium areas
        else if (elevation > 0.45 && elevation < 0.55 && detail > 0.6) {
          tile = TileType.PATH;
        }
        // Stone in high areas
        else if (elevation > 0.7) {
          tile = TileType.FLOOR_STONE;
        }
        // Trees in forests (high moisture)
        else if (moisture > 0.65 && detail > 0.5) {
          tile = TileType.TREE;
        }
        // Bushes in grasslands
        else if (moisture > 0.4 && moisture < 0.6 && detail > 0.7) {
          tile = TileType.BUSH;
        }

        chunk.tiles[y][x] = tile;
      }
    }

    this.chunks.set(key, chunk);
    return chunk;
  }

  // Get tile at world coordinates
  getTile(x: number, y: number): TileType {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);

    // Check modifications first
    const modKey = this.getTileKey(tx, ty);
    if (this.modifications.has(modKey)) {
      const mod = this.modifications.get(modKey);
      return mod === undefined ? TileType.GRASS : mod;
    }

    // Get from chunk
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.generateChunk(cx, cy);

    const localX = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    return chunk.tiles[localY][localX];
  }

  // Set tile at world coordinates
  setTile(tx: number, ty: number, tile: TileType | null): void {
    const key = this.getTileKey(tx, ty);
    if (tile === null) {
      this.modifications.set(key, TileType.GRASS); // Replace with grass
    } else {
      this.modifications.set(key, tile);
    }
  }

  // Check if position is solid
  isSolidAt(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return isSolid(tile);
  }

  // Check if tile is damage
  isDamageAt(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (tile === TileType.SPIKE && this.spikeActive) return true;
    return false;
  }

  // Update world
  update(): void {
    this.spikeTimer++;
    if (this.spikeTimer >= 90) {
      this.spikeTimer = 0;
      this.spikeActive = !this.spikeActive;
    }
  }

  // Check collision for a rectangle
  checkCollision(rect: Rect): boolean {
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

  // Break block at position
  breakBlock(tx: number, ty: number): TileType | null {
    const tile = this.getTile(tx * TILE_SIZE, ty * TILE_SIZE);
    if (isBreakable(tile)) {
      this.setTile(tx, ty, null);
      return tile;
    }
    return null;
  }

  // Place block at position
  placeBlock(tx: number, ty: number, tile: TileType): boolean {
    const currentTile = this.getTile(tx * TILE_SIZE, ty * TILE_SIZE);
    // Can only place on non-solid tiles
    if (!isSolid(currentTile)) {
      this.setTile(tx, ty, tile);
      return true;
    }
    return false;
  }

  // Get visible chunks for rendering
  getVisibleChunks(camX: number, camY: number, viewWidth: number, viewHeight: number): Chunk[] {
    const visible: Chunk[] = [];
    const startCX = Math.floor(camX / (CHUNK_SIZE * TILE_SIZE)) - 1;
    const startCY = Math.floor(camY / (CHUNK_SIZE * TILE_SIZE)) - 1;
    const endCX = Math.ceil((camX + viewWidth) / (CHUNK_SIZE * TILE_SIZE)) + 1;
    const endCY = Math.ceil((camY + viewHeight) / (CHUNK_SIZE * TILE_SIZE)) + 1;

    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        visible.push(this.generateChunk(cx, cy));
      }
    }

    return visible;
  }
}
