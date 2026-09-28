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
// NOTE: Trees and bushes are walkable (only their sprites look solid) so the
// player can never get stuck inside dense foliage. Walls/water/etc. stay solid,
// but the movement code also has an anti-stuck escape if you end up inside one.
export function isSolid(tile: TileType): boolean {
  return tile === TileType.WALL || tile === TileType.WATER ||
    tile === TileType.HOUSE_WALL || tile === TileType.ROOF || tile === TileType.FENCE ||
    tile === TileType.PILLAR || tile === TileType.BOSS_DOOR;
}

export function isBreakable(tile: TileType): boolean {
  return tile === TileType.TREE || tile === TileType.TREE_PINE || tile === TileType.TREE_OAK ||
    tile === TileType.TREE_BIRCH || tile === TileType.TREE_DARK ||
    tile === TileType.BUSH || tile === TileType.WALL ||
    tile === TileType.FENCE || tile === TileType.PILLAR;
}

// True for any of the tree variants (used by rendering & chopping)
export function isTree(tile: TileType): boolean {
  return tile === TileType.TREE || tile === TileType.TREE_PINE || tile === TileType.TREE_OAK ||
    tile === TileType.TREE_BIRCH || tile === TileType.TREE_DARK;
}

export function tileToItem(tile: TileType): string | null {
  switch (tile) {
    case TileType.TREE:
    case TileType.TREE_PINE:
    case TileType.TREE_OAK:
    case TileType.TREE_BIRCH:
    case TileType.TREE_DARK: return 'wood';
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

    // ---- BIOME NOISE (low frequency => large, coherent regions) ----
    const biomeElev = noise(cx * CHUNK_SIZE * 0.012, cy * CHUNK_SIZE * 0.012, this.seed + 5000, 2);
    const biomeMoist = noise(cx * CHUNK_SIZE * 0.012, cy * CHUNK_SIZE * 0.012, this.seed + 6000, 2);
    let biome: number; // 0 desert, 1 plains, 2 forest, 3 rocky, 4 lake
    if (biomeElev < 0.28) biome = 4;            // lake
    else if (biomeElev > 0.72) biome = 3;       // rocky highlands
    else if (biomeMoist < 0.3) biome = 0;       // dry desert
    else if (biomeMoist > 0.62) biome = 2;      // dense forest
    else biome = 1;                             // plains

    // Generate tiles
    for (let y = 0; y < CHUNK_SIZE; y++) {
      chunk.tiles[y] = [];
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const worldX = cx * CHUNK_SIZE + x;
        const worldY = cy * CHUNK_SIZE + y;

        // Local terrain detail
        const elevation = noise(worldX * 0.05, worldY * 0.05, this.seed, 3);
        const moisture = noise(worldX * 0.08, worldY * 0.08, this.seed + 1000, 2);
        const detail = noise(worldX * 0.2, worldY * 0.2, this.seed + 2000, 2);

        let tile = TileType.GRASS;

        switch (biome) {
          case 4: // LAKE: water with occasional reeds/bushes at edges
            if (elevation < 0.42) tile = TileType.WATER;
            else if (detail > 0.75) tile = TileType.BUSH;
            break;
          case 3: // ROCKY: stone ground, boulders (breakable walls), sparse bush
            tile = elevation > 0.5 ? TileType.FLOOR_STONE : TileType.GRASS;
            if (tile === TileType.FLOOR_STONE && detail > 0.82) tile = TileType.WALL;
            else if (tile === TileType.GRASS && detail > 0.88) tile = TileType.BUSH;
            break;
          case 2: // FOREST: dense trees, variety within the biome
            tile = TileType.GRASS;
            if (detail > 0.42) {
              // Pick a tree variant from a dedicated noise channel so trees
              // vary (pine / oak / birch / dark) across the forest.
              const variant = hash(worldX, worldY, this.seed + 777);
              if (variant < 0.35) tile = TileType.TREE_PINE;
              else if (variant < 0.65) tile = TileType.TREE_OAK;
              else if (variant < 0.85) tile = TileType.TREE_BIRCH;
              else tile = TileType.TREE_DARK;
            } else if (moisture > 0.55 && detail > 0.3 && detail <= 0.42) {
              tile = TileType.BUSH;
            }
            break;
          case 0: // DESERT: sand paths and scattered bushes
            tile = detail > 0.55 ? TileType.PATH : TileType.SAND;
            if (detail > 0.9) tile = TileType.BUSH;
            break;
          default: // PLAINS: mostly open grass, few trees, some bushes
            if (detail > 0.86 && moisture > 0.45) tile = TileType.TREE_OAK;
            else if (detail > 0.72) tile = TileType.BUSH;
            else if (elevation > 0.45 && elevation < 0.55 && detail > 0.6) tile = TileType.PATH;
            break;
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

  // Anti-stuck escape: if the rectangle currently overlaps solid tiles,
  // find the nearest free position (searching outward in rings) and return it.
  // This guarantees the player can never be permanently trapped inside terrain.
  escapeIfStuck(rect: Rect): { x: number; y: number } | null {
    if (!this.checkCollision(rect)) return null;
    const step = 2;
    for (let radius = step; radius <= TILE_SIZE * 3; radius += step) {
      // Scan the ring at this radius around the current position
      for (let a = -radius; a <= radius; a += step) {
        const candidates = [
          { x: rect.x + a, y: rect.y - radius },
          { x: rect.x + a, y: rect.y + radius },
          { x: rect.x - radius, y: rect.y + a },
          { x: rect.x + radius, y: rect.y + a },
        ];
        for (const c of candidates) {
          if (!this.checkCollision({ ...rect, x: c.x, y: c.y })) {
            return { x: c.x, y: c.y };
          }
        }
      }
    }
    return null;
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
