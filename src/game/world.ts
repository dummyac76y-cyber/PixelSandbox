// ============================================================
// WORLD - Infinite sandbox with chunk-based generation
// ============================================================
import { TileType, TILE_SIZE, Rect, Vec2 } from './constants';

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

// Tree hitboxes (derived from the tree sprites in sprites.ts):
// The trunk sprite only paints pixels ~6..9 of the 16px tile, so the solid
// hitbox must match the visible trunk instead of blocking the whole tile.
export const TREE_TRUNK_HITBOX = { x: 5, y: 7, w: 6, h: 9 };   // trunk tile
export const TREE_CANOPY_HITBOX = { x: 2, y: 0, w: 12, h: 8 }; // canopy tile above

// Tile collision properties
export function isSolid(tile: TileType): boolean {
  return tile === TileType.WALL || tile === TileType.WATER || tile === TileType.TREE ||
    tile === TileType.HOUSE_WALL || tile === TileType.ROOF || tile === TileType.FENCE ||
    tile === TileType.PILLAR || tile === TileType.BOSS_DOOR || tile === TileType.BUSH;
}

// Returns true if the world point (wx, wy) is inside the solid part of a tile.
// Full-tile blocks keep their whole tile solid; trees use a tight hitbox that
// matches the drawn trunk/canopy sprites so you can walk around/behind them.
export function isTileSolidAtPoint(tile: TileType, wx: number, wy: number): boolean {
  switch (tile) {
    case TileType.TREE: {
      // Trunk tile at (tx, ty); canopy occupies the tile directly above it.
      const tx = Math.floor(wx / TILE_SIZE);
      const ty = Math.floor(wy / TILE_SIZE);
      const lx = wx - tx * TILE_SIZE;
      const ly = wy - ty * TILE_SIZE;

      // Solid area of this tree's trunk tile
      if (lx >= TREE_TRUNK_HITBOX.x && lx < TREE_TRUNK_HITBOX.x + TREE_TRUNK_HITBOX.w &&
          ly >= TREE_TRUNK_HITBOX.y && ly < TREE_TRUNK_HITBOX.y + TREE_TRUNK_HITBOX.h) {
        return true;
      }

      // Canopy of the tree whose trunk sits one tile BELOW this point
      const cly = wy - (ty - 1) * TILE_SIZE; // local Y inside the canopy tile
      if (cly >= TREE_CANOPY_HITBOX.y && cly < TREE_CANOPY_HITBOX.y + TREE_CANOPY_HITBOX.h &&
          lx >= TREE_CANOPY_HITBOX.x && lx < TREE_CANOPY_HITBOX.x + TREE_CANOPY_HITBOX.w) {
        return true;
      }
      return false;
    }
    default:
      return isSolid(tile);
  }
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

  // Check if position is solid (respects per-tile hitboxes, e.g. trees)
  isSolidAt(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return isTileSolidAtPoint(tile, x, y);
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

  // Check collision for a rectangle (samples edges + center, respects hitboxes)
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
      { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 },
    ];
    for (const p of points) {
      if (this.isSolidAt(p.x, p.y)) return true;
    }
    return false;
  }

  // Resolve collision on X axis (snap to the blocking tile edge; push out if stuck)
  resolveX(rect: Rect, vx: number): number {
    let newX = rect.x + vx;
    let testRect = { ...rect, x: newX };
    if (!this.checkCollision(testRect)) {
      return newX;
    }
    if (vx > 0) {
      const tileRight = Math.floor((newX + rect.w) / TILE_SIZE);
      newX = tileRight * TILE_SIZE - rect.w - 0.01;
    } else if (vx < 0) {
      const tileLeft = Math.floor(newX / TILE_SIZE);
      newX = (tileLeft + 1) * TILE_SIZE + 0.01;
    } else if (this.checkCollision(rect)) {
      // Already overlapping (e.g. spawned inside geometry): push out one pixel
      const dirOut = this.findPushDirection(rect);
      newX = rect.x + dirOut.x;
    }
    testRect = { ...rect, x: newX };
    // If still colliding after snapping, keep original position
    if (this.checkCollision(testRect)) return rect.x;
    return newX;
  }

  // Resolve collision on Y axis (snap to the blocking tile edge; push out if stuck)
  resolveY(rect: Rect, vy: number): number {
    let newY = rect.y + vy;
    let testRect = { ...rect, y: newY };
    if (!this.checkCollision(testRect)) {
      return newY;
    }
    if (vy > 0) {
      const tileBottom = Math.floor((newY + rect.h) / TILE_SIZE);
      newY = tileBottom * TILE_SIZE - rect.h - 0.01;
    } else if (vy < 0) {
      const tileTop = Math.floor(newY / TILE_SIZE);
      newY = (tileTop + 1) * TILE_SIZE + 0.01;
    } else if (this.checkCollision(rect)) {
      // Already overlapping (e.g. spawned inside geometry): push out one pixel
      const dirOut = this.findPushDirection(rect);
      newY = rect.y + dirOut.y;
    }
    testRect = { ...rect, y: newY };
    // If still colliding after snapping, keep original position
    if (this.checkCollision(testRect)) return rect.y;
    return newY;
  }

  // Find the direction with the least solid coverage around a rect (for unsticking)
  findPushDirection(rect: Rect): { x: number; y: number } {
    const dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
    ];
    let best = dirs[0];
    let bestScore = Infinity;
    for (const d of dirs) {
      const test = { ...rect, x: rect.x + d.x, y: rect.y + d.y };
      let score = 0;
      const samples = [
        { x: test.x, y: test.y },
        { x: test.x + test.w - 1, y: test.y },
        { x: test.x, y: test.y + test.h - 1 },
        { x: test.x + test.w - 1, y: test.y + test.h - 1 },
        { x: test.x + test.w / 2, y: test.y + test.h / 2 },
      ];
      for (const s of samples) {
        if (this.isSolidAt(s.x, s.y)) score++;
      }
      if (score < bestScore) {
        bestScore = score;
        best = d;
      }
    }
    return best;
  }

  // Unstick an entity whose collision box overlaps solid geometry.
  // `rect` is the entity's collision rect (e.g. hurtbox); returns the new
  // top-left position for that rect after pushing out of walls.
  unstick(rect: Rect): Rect {
    let r = { ...rect };
    for (let i = 0; i < 32; i++) {
      if (!this.checkCollision(r)) break;
      const d = this.findPushDirection(r);
      r = { ...r, x: r.x + d.x, y: r.y + d.y };
    }
    return r;
  }

  // Find a safe spawn position near (worldX, worldY) for a collision box of
  // size (w, h). Prefers grass/path tiles and avoids solid geometry so the
  // player never spawns stuck inside trees, walls or water.
  findSpawnPosition(worldX: number, worldY: number, w: number, h: number): Vec2 {
    const startTX = Math.floor(worldX / TILE_SIZE);
    const startTY = Math.floor(worldY / TILE_SIZE);

    let fallback: Vec2 | null = null;

    // Spiral outward from the requested spawn point
    for (let radius = 0; radius <= 16; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Only walk the ring of the current radius
          if (radius > 0 && Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;

          const tx = startTX + dx;
          const ty = startTY + dy;
          const px = tx * TILE_SIZE + (TILE_SIZE - w) / 2;
          const py = ty * TILE_SIZE + (TILE_SIZE - h);
          const rect: Rect = { x: px, y: py, w, h };

          if (this.checkCollision(rect)) continue;

          const tile = this.getTile(px, py);
          const isFloor = tile === TileType.GRASS || tile === TileType.PATH ||
            tile === TileType.FLOOR_STONE || tile === TileType.FLOOR_WOOD;
          if (isFloor) {
            return { x: px, y: py };
          }
          if (!fallback) {
            fallback = { x: px, y: py };
          }
        }
      }
    }

    // Last resort: unstick from whatever is at the original position
    if (fallback) return fallback;
    const r = this.unstick({ x: worldX, y: worldY, w, h });
    return { x: r.x, y: r.y };
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
