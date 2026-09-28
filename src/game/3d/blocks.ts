// ============================================================
// BLOCKS & TEXTURE ATLAS - 3D Voxel block definitions
// ============================================================
import * as THREE from 'three';

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  WOOD = 5,
  LEAVES = 6,
  PLANKS = 7,
  SAND = 8,
  WATER = 9,
  GLASS = 10,
  BRICK = 11,
  COAL_ORE = 12,
  IRON_ORE = 13,
  GOLD_ORE = 14,
  DIAMOND_ORE = 15,
  TORCH = 16,
  CRAFTING_TABLE = 17,
  BOOKSHELF = 18,
  SNOW = 19,
  STONE_BRICKS = 20,
}

export interface BlockDef {
  id: BlockType;
  name: string;
  hardness: number;
  soundType: 'grass' | 'dirt' | 'stone' | 'wood' | 'sand' | 'glass';
  transparent?: boolean;
  lightLevel?: number;
  dropId: BlockType;
  dropCount: number;
  // Face order: [+Y (top), -Y (bottom), -X (left), +X (right), +Z (front), -Z (back)]
  textures: [number, number, number, number, number, number];
  color: string;
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: { id: BlockType.AIR, name: 'Air', hardness: 0, soundType: 'dirt', transparent: true, dropId: BlockType.AIR, dropCount: 0, textures: [0,0,0,0,0,0], color: '#000000' },
  [BlockType.GRASS]: { id: BlockType.GRASS, name: 'Grass Block', hardness: 0.6, soundType: 'grass', dropId: BlockType.DIRT, dropCount: 1, textures: [0,2,1,1,1,1], color: '#55ab2f' },
  [BlockType.DIRT]: { id: BlockType.DIRT, name: 'Dirt', hardness: 0.5, soundType: 'dirt', dropId: BlockType.DIRT, dropCount: 1, textures: [2,2,2,2,2,2], color: '#876043' },
  [BlockType.STONE]: { id: BlockType.STONE, name: 'Stone', hardness: 1.5, soundType: 'stone', dropId: BlockType.COBBLESTONE, dropCount: 1, textures: [3,3,3,3,3,3], color: '#7d7d7d' },
  [BlockType.COBBLESTONE]: { id: BlockType.COBBLESTONE, name: 'Cobblestone', hardness: 1.8, soundType: 'stone', dropId: BlockType.COBBLESTONE, dropCount: 1, textures: [4,4,4,4,4,4], color: '#6d6d6d' },
  [BlockType.WOOD]: { id: BlockType.WOOD, name: 'Oak Log', hardness: 1.2, soundType: 'wood', dropId: BlockType.WOOD, dropCount: 1, textures: [6,6,5,5,5,5], color: '#6c5432' },
  [BlockType.LEAVES]: { id: BlockType.LEAVES, name: 'Oak Leaves', hardness: 0.3, soundType: 'grass', transparent: true, dropId: BlockType.LEAVES, dropCount: 1, textures: [7,7,7,7,7,7], color: '#48b518' },
  [BlockType.PLANKS]: { id: BlockType.PLANKS, name: 'Oak Planks', hardness: 1.0, soundType: 'wood', dropId: BlockType.PLANKS, dropCount: 1, textures: [8,8,8,8,8,8], color: '#a3834f' },
  [BlockType.SAND]: { id: BlockType.SAND, name: 'Sand', hardness: 0.5, soundType: 'sand', dropId: BlockType.SAND, dropCount: 1, textures: [9,9,9,9,9,9], color: '#dbc689' },
  [BlockType.WATER]: { id: BlockType.WATER, name: 'Water', hardness: 999, soundType: 'sand', transparent: true, dropId: BlockType.AIR, dropCount: 0, textures: [10,10,10,10,10,10], color: '#3f76e4' },
  [BlockType.GLASS]: { id: BlockType.GLASS, name: 'Glass', hardness: 0.3, soundType: 'glass', transparent: true, dropId: BlockType.GLASS, dropCount: 1, textures: [11,11,11,11,11,11], color: '#e0f7fa' },
  [BlockType.BRICK]: { id: BlockType.BRICK, name: 'Bricks', hardness: 2.0, soundType: 'stone', dropId: BlockType.BRICK, dropCount: 1, textures: [12,12,12,12,12,12], color: '#96483a' },
  [BlockType.COAL_ORE]: { id: BlockType.COAL_ORE, name: 'Coal Ore', hardness: 2.2, soundType: 'stone', dropId: BlockType.COAL_ORE, dropCount: 1, textures: [13,13,13,13,13,13], color: '#424242' },
  [BlockType.IRON_ORE]: { id: BlockType.IRON_ORE, name: 'Iron Ore', hardness: 2.5, soundType: 'stone', dropId: BlockType.IRON_ORE, dropCount: 1, textures: [14,14,14,14,14,14], color: '#d1c4e9' },
  [BlockType.GOLD_ORE]: { id: BlockType.GOLD_ORE, name: 'Gold Ore', hardness: 2.8, soundType: 'stone', dropId: BlockType.GOLD_ORE, dropCount: 1, textures: [15,15,15,15,15,15], color: '#ffd54f' },
  [BlockType.DIAMOND_ORE]: { id: BlockType.DIAMOND_ORE, name: 'Diamond Ore', hardness: 3.2, soundType: 'stone', dropId: BlockType.DIAMOND_ORE, dropCount: 1, textures: [16,16,16,16,16,16], color: '#00e5ff' },
  [BlockType.TORCH]: { id: BlockType.TORCH, name: 'Torch', hardness: 0.1, soundType: 'wood', transparent: true, lightLevel: 14, dropId: BlockType.TORCH, dropCount: 1, textures: [17,17,17,17,17,17], color: '#ffb300' },
  [BlockType.CRAFTING_TABLE]: { id: BlockType.CRAFTING_TABLE, name: 'Crafting Table', hardness: 1.5, soundType: 'wood', dropId: BlockType.CRAFTING_TABLE, dropCount: 1, textures: [18,8,19,19,23,19], color: '#8d6e63' },
  [BlockType.BOOKSHELF]: { id: BlockType.BOOKSHELF, name: 'Bookshelf', hardness: 1.2, soundType: 'wood', dropId: BlockType.BOOKSHELF, dropCount: 1, textures: [8,8,20,20,20,20], color: '#a1887f' },
  [BlockType.SNOW]: { id: BlockType.SNOW, name: 'Snow Block', hardness: 0.4, soundType: 'dirt', dropId: BlockType.SNOW, dropCount: 1, textures: [21,2,21,21,21,21], color: '#ffffff' },
  [BlockType.STONE_BRICKS]: { id: BlockType.STONE_BRICKS, name: 'Stone Bricks', hardness: 1.8, soundType: 'stone', dropId: BlockType.STONE_BRICKS, dropCount: 1, textures: [22,22,22,22,22,22], color: '#757575' },
};

export function createVoxelTextureAtlas(): {
  texture: THREE.CanvasTexture;
  material: THREE.MeshStandardMaterial;
  waterMaterial: THREE.MeshStandardMaterial;
  readyPromise: Promise<void>;
} {
  const tileSize = 32;
  const atlasCols = 8;
  const atlasRows = 8;
  const canvas = document.createElement('canvas');
  canvas.width = tileSize * atlasCols;
  canvas.height = tileSize * atlasRows;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;

  function drawTile(index: number, drawFn: (cx: CanvasRenderingContext2D, x: number, y: number) => void) {
    const col = index % atlasCols;
    const row = Math.floor(index / atlasCols);
    ctx.save();
    ctx.translate(col * tileSize, row * tileSize);
    drawFn(ctx, 0, 0);
    ctx.restore();
  }

  // Pre-render procedural fallback textures for all atlas tiles so blocks are never invisible
  drawTile(0, (c) => {
    c.fillStyle = '#55ab2f'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(1, (c) => {
    c.fillStyle='#876043'; c.fillRect(0,0,tileSize,tileSize);
    c.fillStyle='#55ab2f'; c.fillRect(0,0,tileSize,6);
  });
  drawTile(2, (c) => {
    c.fillStyle='#876043'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(3, (c) => {
    c.fillStyle='#7d7d7d'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(4, (c) => {
    c.fillStyle='#6d6d6d'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(5, (c) => {
    c.fillStyle='#6c5432'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(6, (c) => {
    c.fillStyle='#957848'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(7, (c) => {
    c.fillStyle='#48b518'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(8, (c) => {
    c.fillStyle='#a3834f'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(9, (c) => {
    c.fillStyle='#dbc689'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(10, (c) => {
    c.fillStyle='#3f76e4'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(11, (c) => {
    c.fillStyle='rgba(210,240,255,.45)'; c.fillRect(0,0,tileSize,tileSize);
  });
  drawTile(12, (c) => {
    c.fillStyle='#96483a'; c.fillRect(0,0,tileSize,tileSize);
  });
  function drawOreFallback(index: number, color: string) {
    drawTile(index, (c) => {
      c.fillStyle='#7d7d7d'; c.fillRect(0,0,tileSize,tileSize);
      c.fillStyle=color; c.fillRect(8,8,16,16);
    });
  }
  drawOreFallback(13, '#262626');
  drawOreFallback(14, '#d1c4e9');
  drawOreFallback(15, '#ffd54f');
  drawOreFallback(16, '#00e5ff');
  drawTile(17, (c) => { c.clearRect(0,0,tileSize,tileSize); c.fillStyle='#ffb300'; c.fillRect(12,8,8,16); });
  drawTile(18, (c) => { c.fillStyle='#a3834f'; c.fillRect(0,0,tileSize,tileSize); });
  drawTile(19, (c) => { c.fillStyle='#8d6e63'; c.fillRect(0,0,tileSize,tileSize); });
  drawTile(20, (c) => { c.fillStyle='#a1887f'; c.fillRect(0,0,tileSize,tileSize); });
  drawTile(21, (c) => { c.fillStyle='#ffffff'; c.fillRect(0,0,tileSize,tileSize); });
  drawTile(22, (c) => { c.fillStyle='#757575'; c.fillRect(0,0,tileSize,tileSize); });
  drawTile(23, (c) => { c.fillStyle='#8d6e63'; c.fillRect(0,0,tileSize,tileSize); });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  // Real PNG block resource mappings from resource pack
  const blockAssets: Array<[number, string[], { tint?: [number, number, number]; overlay?: string }?]> = [
    [0, ['/assets/resources/blocks/grass_block_top.png', '/resourcepack/assets/minecraft/textures/block/grass_block_top.png'], { tint: [85, 171, 47] }],
    [1, ['/assets/resources/blocks/grass_block_side.png', '/resourcepack/assets/minecraft/textures/block/grass_block_side.png']],
    [2, ['/assets/resources/blocks/dirt.png', '/resourcepack/assets/minecraft/textures/block/dirt.png']],
    [3, ['/assets/resources/blocks/stone.png', '/resourcepack/assets/minecraft/textures/block/stone.png']],
    [4, ['/assets/resources/blocks/cobblestone.png', '/resourcepack/assets/minecraft/textures/block/cobblestone.png']],
    [5, ['/assets/resources/blocks/oak_log.png', '/resourcepack/assets/minecraft/textures/block/oak_log.png']],
    [6, ['/assets/resources/blocks/oak_log_top.png', '/resourcepack/assets/minecraft/textures/block/oak_log_top.png']],
    [7, ['/assets/resources/blocks/oak_leaves.png', '/resourcepack/assets/minecraft/textures/block/oak_leaves.png'], { tint: [72, 181, 24] }],
    [8, ['/assets/resources/blocks/oak_planks.png', '/resourcepack/assets/minecraft/textures/block/oak_planks.png']],
    [9, ['/assets/resources/blocks/sand.png', '/resourcepack/assets/minecraft/textures/block/sand.png']],
    [11, ['/assets/resources/blocks/glass.png', '/resourcepack/assets/minecraft/textures/block/glass.png']],
    [12, ['/assets/resources/blocks/bricks.png', '/resourcepack/assets/minecraft/textures/block/bricks.png']],
    [13, ['/assets/resources/blocks/coal_ore.png', '/resourcepack/assets/minecraft/textures/block/coal_ore.png']],
    [14, ['/assets/resources/blocks/iron_ore.png', '/resourcepack/assets/minecraft/textures/block/iron_ore.png']],
    [15, ['/assets/resources/blocks/gold_ore.png', '/resourcepack/assets/minecraft/textures/block/gold_ore.png']],
    [16, ['/assets/resources/blocks/diamond_ore.png', '/resourcepack/assets/minecraft/textures/block/diamond_ore.png']],
    [17, ['/assets/resources/blocks/torch.png', '/resourcepack/assets/minecraft/textures/block/torch.png']],
    [18, ['/assets/resources/blocks/crafting_table_top.png', '/resourcepack/assets/minecraft/textures/block/crafting_table_top.png']],
    [19, ['/assets/resources/blocks/crafting_table_side.png', '/resourcepack/assets/minecraft/textures/block/crafting_table_side.png']],
    [20, ['/assets/resources/blocks/bookshelf.png', '/resourcepack/assets/minecraft/textures/block/bookshelf.png']],
    [21, ['/assets/resources/blocks/snow.png', '/resourcepack/assets/minecraft/textures/block/snow.png']],
    [22, ['/assets/resources/blocks/stone_bricks.png', '/resourcepack/assets/minecraft/textures/block/stone_bricks.png']],
    [23, ['/assets/resources/blocks/crafting_table_front.png', '/resourcepack/assets/minecraft/textures/block/crafting_table_front.png']],
  ];

  function loadSingleImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  async function loadTileSources(
    tileIndex: number,
    sources: string[],
    options?: { tint?: [number, number, number]; overlay?: string }
  ): Promise<void> {
    for (const src of sources) {
      try {
        const image = await loadSingleImage(src);
        const col = tileIndex % atlasCols;
        const row = Math.floor(tileIndex / atlasCols);
        const destX = col * tileSize;
        const destY = row * tileSize;

        ctx.clearRect(destX, destY, tileSize, tileSize);
        ctx.imageSmoothingEnabled = false;

        if (options?.tint) {
          // Draw image to temp canvas to apply tint multiply
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = image.width;
          tempCanvas.height = image.height;
          const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
          tempCtx.imageSmoothingEnabled = false;
          tempCtx.drawImage(image, 0, 0);

          const imgData = tempCtx.getImageData(0, 0, image.width, image.height);
          const data = imgData.data;
          const [tr, tg, tb] = options.tint;

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
              data[i] = Math.round((data[i] / 255) * tr);
              data[i + 1] = Math.round((data[i + 1] / 255) * tg);
              data[i + 2] = Math.round((data[i + 2] / 255) * tb);
            }
          }
          tempCtx.putImageData(imgData, 0, 0);
          ctx.drawImage(tempCanvas, destX, destY, tileSize, tileSize);
        } else {
          ctx.drawImage(image, destX, destY, tileSize, tileSize);
        }

        return;
      } catch {
        // Try next source or retain procedural fallback
      }
    }
  }

  const readyPromise = Promise.all(
    blockAssets.map(([index, sources, options]) => loadTileSources(index, sources, options))
  ).then(() => {
    texture.needsUpdate = true;
  });

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    metalness: 0.1,
    alphaTest: 0.5,
    vertexColors: true,
  });

  const waterMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
  });

  return { texture, material, waterMaterial, readyPromise };
}

export function getAtlasUVs(tileIndex: number): { u0: number; v0: number; u1: number; v1: number } {
  const atlasCols = 8;
  const atlasRows = 8;
  const col = tileIndex % atlasCols;
  const row = Math.floor(tileIndex / atlasCols);
  const u0 = col / atlasCols;
  const u1 = (col + 1) / atlasCols;
  const v1 = 1.0 - row / atlasRows;
  const v0 = 1.0 - (row + 1) / atlasRows;
  return { u0, v0, u1, v1 };
}
