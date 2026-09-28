// ============================================================
// RESOURCE PACK ASSET REGISTRY - Centralized Texture & Icon Resolver
// ============================================================
import * as THREE from 'three';
import { BlockType } from './blocks';

// Base resource pack paths
const BLOCK_TEX_DIR = '/resourcepack/assets/minecraft/textures/block';
const ITEM_TEX_DIR = '/resourcepack/assets/minecraft/textures/item';

export interface BlockTextureSpec {
  top: string;
  bottom: string;
  side: string;
  front?: string;
  back?: string;
  tint?: [number, number, number]; // [r, g, b] 0-255
}

// Canonical texture mapping for all BlockTypes
export const BLOCK_RESOURCE_MAP: Record<BlockType, BlockTextureSpec> = {
  [BlockType.AIR]: {
    top: '', bottom: '', side: '',
  },
  [BlockType.GRASS]: {
    top: `${BLOCK_TEX_DIR}/grass_block_top.png`,
    bottom: `${BLOCK_TEX_DIR}/dirt.png`,
    side: `${BLOCK_TEX_DIR}/grass_block_side.png`,
    tint: [85, 171, 47], // #55ab2f foliage green
  },
  [BlockType.DIRT]: {
    top: `${BLOCK_TEX_DIR}/dirt.png`,
    bottom: `${BLOCK_TEX_DIR}/dirt.png`,
    side: `${BLOCK_TEX_DIR}/dirt.png`,
  },
  [BlockType.STONE]: {
    top: `${BLOCK_TEX_DIR}/stone.png`,
    bottom: `${BLOCK_TEX_DIR}/stone.png`,
    side: `${BLOCK_TEX_DIR}/stone.png`,
  },
  [BlockType.COBBLESTONE]: {
    top: `${BLOCK_TEX_DIR}/cobblestone.png`,
    bottom: `${BLOCK_TEX_DIR}/cobblestone.png`,
    side: `${BLOCK_TEX_DIR}/cobblestone.png`,
  },
  [BlockType.WOOD]: {
    top: `${BLOCK_TEX_DIR}/oak_log_top.png`,
    bottom: `${BLOCK_TEX_DIR}/oak_log_top.png`,
    side: `${BLOCK_TEX_DIR}/oak_log.png`,
  },
  [BlockType.LEAVES]: {
    top: `${BLOCK_TEX_DIR}/oak_leaves.png`,
    bottom: `${BLOCK_TEX_DIR}/oak_leaves.png`,
    side: `${BLOCK_TEX_DIR}/oak_leaves.png`,
    tint: [72, 181, 24],
  },
  [BlockType.PLANKS]: {
    top: `${BLOCK_TEX_DIR}/oak_planks.png`,
    bottom: `${BLOCK_TEX_DIR}/oak_planks.png`,
    side: `${BLOCK_TEX_DIR}/oak_planks.png`,
  },
  [BlockType.SAND]: {
    top: `${BLOCK_TEX_DIR}/sand.png`,
    bottom: `${BLOCK_TEX_DIR}/sand.png`,
    side: `${BLOCK_TEX_DIR}/sand.png`,
  },
  [BlockType.WATER]: {
    top: `${BLOCK_TEX_DIR}/water_still.png`,
    bottom: `${BLOCK_TEX_DIR}/water_still.png`,
    side: `${BLOCK_TEX_DIR}/water_still.png`,
  },
  [BlockType.GLASS]: {
    top: `${BLOCK_TEX_DIR}/glass.png`,
    bottom: `${BLOCK_TEX_DIR}/glass.png`,
    side: `${BLOCK_TEX_DIR}/glass.png`,
  },
  [BlockType.BRICK]: {
    top: `${BLOCK_TEX_DIR}/bricks.png`,
    bottom: `${BLOCK_TEX_DIR}/bricks.png`,
    side: `${BLOCK_TEX_DIR}/bricks.png`,
  },
  [BlockType.COAL_ORE]: {
    top: `${BLOCK_TEX_DIR}/coal_ore.png`,
    bottom: `${BLOCK_TEX_DIR}/coal_ore.png`,
    side: `${BLOCK_TEX_DIR}/coal_ore.png`,
  },
  [BlockType.IRON_ORE]: {
    top: `${BLOCK_TEX_DIR}/iron_ore.png`,
    bottom: `${BLOCK_TEX_DIR}/iron_ore.png`,
    side: `${BLOCK_TEX_DIR}/iron_ore.png`,
  },
  [BlockType.GOLD_ORE]: {
    top: `${BLOCK_TEX_DIR}/gold_ore.png`,
    bottom: `${BLOCK_TEX_DIR}/gold_ore.png`,
    side: `${BLOCK_TEX_DIR}/gold_ore.png`,
  },
  [BlockType.DIAMOND_ORE]: {
    top: `${BLOCK_TEX_DIR}/diamond_ore.png`,
    bottom: `${BLOCK_TEX_DIR}/diamond_ore.png`,
    side: `${BLOCK_TEX_DIR}/diamond_ore.png`,
  },
  [BlockType.TORCH]: {
    top: `${BLOCK_TEX_DIR}/torch.png`,
    bottom: `${BLOCK_TEX_DIR}/torch.png`,
    side: `${BLOCK_TEX_DIR}/torch.png`,
  },
  [BlockType.CRAFTING_TABLE]: {
    top: `${BLOCK_TEX_DIR}/crafting_table_top.png`,
    bottom: `${BLOCK_TEX_DIR}/oak_planks.png`,
    side: `${BLOCK_TEX_DIR}/crafting_table_side.png`,
    front: `${BLOCK_TEX_DIR}/crafting_table_front.png`,
  },
  [BlockType.BOOKSHELF]: {
    top: `${BLOCK_TEX_DIR}/oak_planks.png`,
    bottom: `${BLOCK_TEX_DIR}/oak_planks.png`,
    side: `${BLOCK_TEX_DIR}/bookshelf.png`,
  },
  [BlockType.SNOW]: {
    top: `${BLOCK_TEX_DIR}/snow.png`,
    bottom: `${BLOCK_TEX_DIR}/dirt.png`,
    side: `${BLOCK_TEX_DIR}/snow.png`,
  },
  [BlockType.STONE_BRICKS]: {
    top: `${BLOCK_TEX_DIR}/stone_bricks.png`,
    bottom: `${BLOCK_TEX_DIR}/stone_bricks.png`,
    side: `${BLOCK_TEX_DIR}/stone_bricks.png`,
  },
};

// Canonical texture mapping for all Item IDs
export const ITEM_RESOURCE_MAP: Record<string, string> = {
  // Blocks
  grass: `${BLOCK_TEX_DIR}/grass_block_top.png`,
  dirt: `${BLOCK_TEX_DIR}/dirt.png`,
  stone: `${BLOCK_TEX_DIR}/stone.png`,
  cobblestone: `${BLOCK_TEX_DIR}/cobblestone.png`,
  wood: `${BLOCK_TEX_DIR}/oak_log.png`,
  oak_log: `${BLOCK_TEX_DIR}/oak_log.png`,
  planks: `${BLOCK_TEX_DIR}/oak_planks.png`,
  oak_planks: `${BLOCK_TEX_DIR}/oak_planks.png`,
  leaves: `${BLOCK_TEX_DIR}/oak_leaves.png`,
  oak_leaves: `${BLOCK_TEX_DIR}/oak_leaves.png`,
  sand: `${BLOCK_TEX_DIR}/sand.png`,
  glass: `${BLOCK_TEX_DIR}/glass.png`,
  brick: `${BLOCK_TEX_DIR}/bricks.png`,
  bricks: `${BLOCK_TEX_DIR}/bricks.png`,
  stone_bricks: `${BLOCK_TEX_DIR}/stone_bricks.png`,
  torch: `${BLOCK_TEX_DIR}/torch.png`,
  crafting_table: `${BLOCK_TEX_DIR}/crafting_table_front.png`,
  bookshelf: `${BLOCK_TEX_DIR}/bookshelf.png`,
  coal_ore: `${BLOCK_TEX_DIR}/coal_ore.png`,
  iron_ore: `${BLOCK_TEX_DIR}/iron_ore.png`,
  gold_ore: `${BLOCK_TEX_DIR}/gold_ore.png`,
  diamond_ore: `${BLOCK_TEX_DIR}/diamond_ore.png`,
  snow: `${BLOCK_TEX_DIR}/snow.png`,

  // Items & Tools
  stick: `${ITEM_TEX_DIR}/stick.png`,
  coal: `${ITEM_TEX_DIR}/coal.png`,
  iron_ingot: `${ITEM_TEX_DIR}/iron_ingot.png`,
  gold_ingot: `${ITEM_TEX_DIR}/gold_ingot.png`,
  diamond: `${ITEM_TEX_DIR}/diamond.png`,

  pickaxe_wood: `${ITEM_TEX_DIR}/wooden_pickaxe.png`,
  wooden_pickaxe: `${ITEM_TEX_DIR}/wooden_pickaxe.png`,
  pickaxe_stone: `${ITEM_TEX_DIR}/stone_pickaxe.png`,
  stone_pickaxe: `${ITEM_TEX_DIR}/stone_pickaxe.png`,
  pickaxe_iron: `${ITEM_TEX_DIR}/iron_pickaxe.png`,
  iron_pickaxe: `${ITEM_TEX_DIR}/iron_pickaxe.png`,
  pickaxe_diamond: `${ITEM_TEX_DIR}/diamond_pickaxe.png`,
  diamond_pickaxe: `${ITEM_TEX_DIR}/diamond_pickaxe.png`,

  axe_wood: `${ITEM_TEX_DIR}/wooden_axe.png`,
  wooden_axe: `${ITEM_TEX_DIR}/wooden_axe.png`,
  axe_iron: `${ITEM_TEX_DIR}/iron_axe.png`,
  iron_axe: `${ITEM_TEX_DIR}/iron_axe.png`,

  sword_wood: `${ITEM_TEX_DIR}/wooden_sword.png`,
  wooden_sword: `${ITEM_TEX_DIR}/wooden_sword.png`,
  sword_iron: `${ITEM_TEX_DIR}/iron_sword.png`,
  iron_sword: `${ITEM_TEX_DIR}/iron_sword.png`,
  sword_diamond: `${ITEM_TEX_DIR}/diamond_sword.png`,
  diamond_sword: `${ITEM_TEX_DIR}/diamond_sword.png`,
};

// Cache for generated Data URLs (for tinted textures like grass and leaves)
const generatedDataUrlCache: Record<string, string> = {};
const threeTextureCache: Record<string, THREE.Texture> = {};

/**
 * Load an image asynchronously
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Create a green-tinted Grass Block 32x32 isometric item icon data URL
 */
export async function generateGrassBlockIconUrl(): Promise<string> {
  if (generatedDataUrlCache['grass_icon']) {
    return generatedDataUrlCache['grass_icon'];
  }

  try {
    const topImg = await loadImage(`${BLOCK_TEX_DIR}/grass_block_top.png`);
    const sideImg = await loadImage(`${BLOCK_TEX_DIR}/grass_block_side.png`);
    const sideOverlayImg = await loadImage(`${BLOCK_TEX_DIR}/grass_block_side_overlay.png`);

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;

    // Tint top face green
    const topCanvas = document.createElement('canvas');
    topCanvas.width = 16;
    topCanvas.height = 16;
    const topCtx = topCanvas.getContext('2d', { willReadFrequently: true })!;
    topCtx.imageSmoothingEnabled = false;
    topCtx.drawImage(topImg, 0, 0, 16, 16);
    const topData = topCtx.getImageData(0, 0, 16, 16);
    const [tr, tg, tb] = [85, 171, 47];
    for (let i = 0; i < topData.data.length; i += 4) {
      if (topData.data[i + 3] > 0) {
        topData.data[i] = Math.round((topData.data[i] / 255) * tr);
        topData.data[i + 1] = Math.round((topData.data[i + 1] / 255) * tg);
        topData.data[i + 2] = Math.round((topData.data[i + 2] / 255) * tb);
      }
    }
    topCtx.putImageData(topData, 0, 0);

    // Composite side with tinted overlay
    const sideCanvas = document.createElement('canvas');
    sideCanvas.width = 16;
    sideCanvas.height = 16;
    const sideCtx = sideCanvas.getContext('2d', { willReadFrequently: true })!;
    sideCtx.imageSmoothingEnabled = false;
    sideCtx.drawImage(sideImg, 0, 0, 16, 16);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = 16;
    overlayCanvas.height = 16;
    const overlayCtx = overlayCanvas.getContext('2d', { willReadFrequently: true })!;
    overlayCtx.imageSmoothingEnabled = false;
    overlayCtx.drawImage(sideOverlayImg, 0, 0, 16, 16);
    const overlayData = overlayCtx.getImageData(0, 0, 16, 16);
    for (let i = 0; i < overlayData.data.length; i += 4) {
      if (overlayData.data[i + 3] > 0) {
        overlayData.data[i] = Math.round((overlayData.data[i] / 255) * tr);
        overlayData.data[i + 1] = Math.round((overlayData.data[i + 1] / 255) * tg);
        overlayData.data[i + 2] = Math.round((overlayData.data[i + 2] / 255) * tb);
      }
    }
    overlayCtx.putImageData(overlayData, 0, 0);
    sideCtx.drawImage(overlayCanvas, 0, 0);

    // Draw isometric 3D block
    ctx.clearRect(0, 0, 32, 32);

    // Top face isometric transformation
    ctx.save();
    ctx.translate(16, 3);
    ctx.scale(1, 0.5);
    ctx.rotate(Math.PI / 4);
    ctx.drawImage(topCanvas, -11.3, -11.3, 22.6, 22.6);
    ctx.restore();

    // Draw flat 2D fallback or side projection if matrix not available
    ctx.drawImage(topCanvas, 4, 4, 24, 24);

    const url = canvas.toDataURL('image/png');
    generatedDataUrlCache['grass_icon'] = url;
    generatedDataUrlCache['grass'] = url;
    generatedDataUrlCache['grass_block'] = url;
    return url;
  } catch {
    // Return direct path if async load fails
    return `${BLOCK_TEX_DIR}/grass_block_top.png`;
  }
}

/**
 * Generate a tinted Oak Leaves icon
 */
export async function generateOakLeavesIconUrl(): Promise<string> {
  if (generatedDataUrlCache['leaves_icon']) {
    return generatedDataUrlCache['leaves_icon'];
  }

  try {
    const img = await loadImage(`${BLOCK_TEX_DIR}/oak_leaves.png`);
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(img, 0, 0, 32, 32);
    const imgData = ctx.getImageData(0, 0, 32, 32);
    const [tr, tg, tb] = [72, 181, 24];

    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i + 3] > 0) {
        imgData.data[i] = Math.round((imgData.data[i] / 255) * tr);
        imgData.data[i + 1] = Math.round((imgData.data[i + 1] / 255) * tg);
        imgData.data[i + 2] = Math.round((imgData.data[i + 2] / 255) * tb);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const url = canvas.toDataURL('image/png');
    generatedDataUrlCache['leaves_icon'] = url;
    generatedDataUrlCache['leaves'] = url;
    generatedDataUrlCache['oak_leaves'] = url;
    return url;
  } catch {
    return `${BLOCK_TEX_DIR}/oak_leaves.png`;
  }
}

/**
 * Preload and initialize data URLs for special items
 */
export async function initializeResourceRegistry(): Promise<void> {
  await Promise.all([
    generateGrassBlockIconUrl(),
    generateOakLeavesIconUrl(),
  ]);
}

/**
 * Get item UI icon URL from centralized registry
 */
export function getItemIconUrl(itemId: string): string {
  if (generatedDataUrlCache[itemId]) {
    return generatedDataUrlCache[itemId];
  }
  if (ITEM_RESOURCE_MAP[itemId]) {
    return ITEM_RESOURCE_MAP[itemId];
  }
  return `${ITEM_TEX_DIR}/dirt.png`;
}

/**
 * Load a Three.js Texture for a resourcepack PNG path
 */
export function getThreeTexture(path: string): THREE.Texture {
  if (threeTextureCache[path]) {
    return threeTextureCache[path];
  }

  const texture = new THREE.TextureLoader().load(path);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  threeTextureCache[path] = texture;
  return texture;
}

/**
 * Create 6 materials for a 3D block cube using resourcepack textures
 * Order: [+X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)]
 */
export function createBlockMaterials(blockType: BlockType): THREE.MeshStandardMaterial[] {
  const spec = BLOCK_RESOURCE_MAP[blockType];
  if (!spec) {
    const defaultMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
    return new Array(6).fill(defaultMat);
  }

  const topTex = getThreeTexture(spec.top);
  const bottomTex = getThreeTexture(spec.bottom);
  const sideTex = getThreeTexture(spec.side);
  const frontTex = spec.front ? getThreeTexture(spec.front) : sideTex;

  const topMat = new THREE.MeshStandardMaterial({
    map: topTex,
    roughness: 0.8,
    color: spec.tint ? new THREE.Color(`rgb(${spec.tint.join(',')})`) : 0xffffff,
  });

  const bottomMat = new THREE.MeshStandardMaterial({ map: bottomTex, roughness: 0.8 });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.8 });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.8 });

  return [sideMat, sideMat, topMat, bottomMat, frontMat, sideMat];
}

/**
 * Create 3D Object for held items (both 1st-person hand and 3rd-person avatar hand)
 */
export function createHeldItemMesh(itemId: string, scale = 0.28): THREE.Object3D {
  // Check if item maps to a placeable BlockType
  let blockType: BlockType | undefined;
  switch (itemId) {
    case 'grass':
    case 'grass_block': blockType = BlockType.GRASS; break;
    case 'dirt': blockType = BlockType.DIRT; break;
    case 'stone': blockType = BlockType.STONE; break;
    case 'cobblestone': blockType = BlockType.COBBLESTONE; break;
    case 'wood':
    case 'oak_log': blockType = BlockType.WOOD; break;
    case 'planks':
    case 'oak_planks': blockType = BlockType.PLANKS; break;
    case 'leaves':
    case 'oak_leaves': blockType = BlockType.LEAVES; break;
    case 'sand': blockType = BlockType.SAND; break;
    case 'glass': blockType = BlockType.GLASS; break;
    case 'brick':
    case 'bricks': blockType = BlockType.BRICK; break;
    case 'stone_bricks': blockType = BlockType.STONE_BRICKS; break;
    case 'crafting_table': blockType = BlockType.CRAFTING_TABLE; break;
    case 'bookshelf': blockType = BlockType.BOOKSHELF; break;
    case 'coal_ore': blockType = BlockType.COAL_ORE; break;
    case 'iron_ore': blockType = BlockType.IRON_ORE; break;
    case 'gold_ore': blockType = BlockType.GOLD_ORE; break;
    case 'diamond_ore': blockType = BlockType.DIAMOND_ORE; break;
    case 'snow': blockType = BlockType.SNOW; break;
  }

  if (blockType !== undefined && blockType !== BlockType.AIR) {
    // Render mini 3D block cube with real resource pack textures on all faces
    const geo = new THREE.BoxGeometry(scale, scale, scale);
    const mats = createBlockMaterials(blockType);
    const mesh = new THREE.Mesh(geo, mats);
    mesh.rotation.set(0.3, -0.5, 0.1);
    return mesh;
  }

  // 2D Item / Tool / Torch / Material
  const group = new THREE.Group();
  const iconUrl = getItemIconUrl(itemId);
  const texture = getThreeTexture(iconUrl);

  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
    roughness: 0.5,
    metalness: itemId.includes('diamond') || itemId.includes('iron') ? 0.3 : 0.1,
  });

  const geo = new THREE.PlaneGeometry(scale * 1.25, scale * 1.25);
  const plane = new THREE.Mesh(geo, mat);

  // Rotate plane so tool points forward-right
  plane.rotation.set(-0.2, 0.3, -0.6);
  plane.position.set(0.02, 0.05, 0.02);
  group.add(plane);

  return group;
}
