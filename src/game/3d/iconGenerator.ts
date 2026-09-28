// ============================================================
// ICON GENERATOR - Item & Block Sprites with PNG Resource Pack Support
// ============================================================
import { ITEM_DEFS } from './resources';

const spriteCache: Record<string, string> = {};

// Primary resource PNG mapping for items and blocks in public/assets/resources/
const ITEM_RESOURCE_MAP: Record<string, string> = {
  // Blocks
  grass: '/assets/resources/blocks/grass_block_top.png',
  dirt: '/assets/resources/blocks/dirt.png',
  stone: '/assets/resources/blocks/stone.png',
  cobblestone: '/assets/resources/blocks/cobblestone.png',
  wood: '/assets/resources/blocks/oak_log.png',
  planks: '/assets/resources/blocks/oak_planks.png',
  leaves: '/assets/resources/blocks/oak_leaves.png',
  sand: '/assets/resources/blocks/sand.png',
  glass: '/assets/resources/blocks/glass.png',
  brick: '/assets/resources/blocks/bricks.png',
  stone_bricks: '/assets/resources/blocks/stone_bricks.png',
  torch: '/assets/resources/blocks/torch.png',
  crafting_table: '/assets/resources/blocks/crafting_table_front.png',
  bookshelf: '/assets/resources/blocks/bookshelf.png',
  coal_ore: '/assets/resources/blocks/coal_ore.png',
  iron_ore: '/assets/resources/blocks/iron_ore.png',
  gold_ore: '/assets/resources/blocks/gold_ore.png',
  diamond_ore: '/assets/resources/blocks/diamond_ore.png',
  snow: '/assets/resources/blocks/snow.png',

  // Items & Tools
  stick: '/assets/resources/items/stick.png',
  coal: '/assets/resources/items/coal.png',
  iron_ingot: '/assets/resources/items/iron_ingot.png',
  gold_ingot: '/assets/resources/items/gold_ingot.png',
  diamond: '/assets/resources/items/diamond.png',

  pickaxe_wood: '/assets/resources/items/wooden_pickaxe.png',
  pickaxe_stone: '/assets/resources/items/stone_pickaxe.png',
  pickaxe_iron: '/assets/resources/items/iron_pickaxe.png',
  pickaxe_diamond: '/assets/resources/items/diamond_pickaxe.png',

  axe_wood: '/assets/resources/items/wooden_axe.png',
  axe_iron: '/assets/resources/items/iron_axe.png',

  sword_wood: '/assets/resources/items/wooden_sword.png',
  sword_iron: '/assets/resources/items/iron_sword.png',
  sword_diamond: '/assets/resources/items/diamond_sword.png',
};

// Helper: draw an isometric 32x32 voxel cube on canvas for fallbacks
function drawIsometricBlock(
  ctx: CanvasRenderingContext2D,
  topColors: [string, string],
  leftColors: [string, string],
  rightColors: [string, string],
  decorFn?: (c: CanvasRenderingContext2D) => void
) {
  ctx.clearRect(0, 0, 32, 32);

  // Top face
  ctx.beginPath();
  ctx.moveTo(16, 3);
  ctx.lineTo(28, 10);
  ctx.lineTo(16, 17);
  ctx.lineTo(4, 10);
  ctx.closePath();
  ctx.fillStyle = topColors[0];
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#18181b';
  ctx.stroke();

  // Top face shading detail
  ctx.fillStyle = topColors[1];
  ctx.beginPath();
  ctx.moveTo(16, 5);
  ctx.lineTo(25, 10);
  ctx.lineTo(16, 15);
  ctx.lineTo(7, 10);
  ctx.closePath();
  ctx.fill();

  // Left face
  ctx.beginPath();
  ctx.moveTo(4, 10);
  ctx.lineTo(16, 17);
  ctx.lineTo(16, 29);
  ctx.lineTo(4, 22);
  ctx.closePath();
  ctx.fillStyle = leftColors[0];
  ctx.fill();
  ctx.strokeStyle = '#18181b';
  ctx.stroke();

  ctx.fillStyle = leftColors[1];
  ctx.fillRect(6, 14, 8, 4);

  // Right face
  ctx.beginPath();
  ctx.moveTo(16, 17);
  ctx.lineTo(28, 10);
  ctx.lineTo(28, 22);
  ctx.lineTo(16, 29);
  ctx.closePath();
  ctx.fillStyle = rightColors[0];
  ctx.fill();
  ctx.strokeStyle = '#18181b';
  ctx.stroke();

  ctx.fillStyle = rightColors[1];
  ctx.fillRect(18, 14, 8, 5);

  if (decorFn) {
    decorFn(ctx);
  }
}

// Generate fallback 32x32 sprite using canvas drawing
export function getItemFallbackSprite(itemId: string): string {
  if (spriteCache[itemId]) return spriteCache[itemId];

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const def = ITEM_DEFS[itemId];
  const color = def ? def.color : '#aaaaaa';

  switch (itemId) {
    case 'grass':
    case 'grass_block':
      drawIsometricBlock(
        ctx,
        ['#5cb85c', '#4ca64c'],
        ['#7a5230', '#634226'],
        ['#5c3d23', '#49301c'],
        (c) => {
          c.fillStyle = '#4ca64c';
          c.beginPath();
          c.moveTo(4, 10);
          c.lineTo(16, 17);
          c.lineTo(16, 20);
          c.lineTo(13, 19);
          c.lineTo(10, 21);
          c.lineTo(7, 18);
          c.lineTo(4, 19);
          c.closePath();
          c.fill();

          c.fillStyle = '#3d8b3d';
          c.beginPath();
          c.moveTo(16, 17);
          c.lineTo(28, 10);
          c.lineTo(28, 18);
          c.lineTo(25, 20);
          c.lineTo(22, 18);
          c.lineTo(19, 21);
          c.lineTo(16, 19);
          c.closePath();
          c.fill();
        }
      );
      break;

    case 'dirt':
      drawIsometricBlock(ctx, ['#8d603d', '#785032'], ['#6d472c', '#5a3a23'], ['#5a3a23', '#482e1b']);
      break;

    case 'stone':
      drawIsometricBlock(ctx, ['#9e9e9e', '#8a8a8a'], ['#757575', '#616161'], ['#616161', '#424242']);
      break;

    case 'cobblestone':
      drawIsometricBlock(ctx, ['#888888', '#737373'], ['#666666', '#525252'], ['#4d4d4d', '#3d3d3d'], (c) => {
        c.fillStyle = '#262626';
        c.fillRect(9, 8, 3, 2);
        c.fillRect(20, 7, 2, 2);
        c.fillRect(8, 18, 4, 2);
        c.fillRect(20, 19, 3, 2);
      });
      break;

    case 'stone_bricks':
      drawIsometricBlock(ctx, ['#999999', '#858585'], ['#737373', '#5c5c5c'], ['#5c5c5c', '#474747'], (c) => {
        c.fillStyle = '#2b2b2b';
        c.fillRect(5, 15, 10, 1);
        c.fillRect(17, 16, 10, 1);
        c.fillRect(10, 11, 1, 4);
        c.fillRect(22, 12, 1, 4);
      });
      break;

    case 'wood':
    case 'oak_log':
      drawIsometricBlock(ctx, ['#d7a15c', '#b8823d'], ['#6d4c38', '#583c2c'], ['#583c2c', '#432d20'], (c) => {
        c.strokeStyle = '#8d5c27';
        c.lineWidth = 1;
        c.strokeRect(13, 8, 6, 4);
      });
      break;

    case 'planks':
    case 'oak_planks':
      drawIsometricBlock(ctx, ['#caa472', '#b38b58'], ['#9e7747', '#876337'], ['#876337', '#6e4f29'], (c) => {
        c.fillStyle = '#4a3319';
        c.fillRect(7, 16, 8, 1);
        c.fillRect(18, 17, 8, 1);
      });
      break;

    case 'leaves':
    case 'oak_leaves':
      drawIsometricBlock(ctx, ['#43a047', '#388e3c'], ['#2e7d32', '#1b5e20'], ['#1b5e20', '#144618']);
      break;

    case 'sand':
      drawIsometricBlock(ctx, ['#fde08b', '#f5ce62'], ['#deb147', '#c99d37'], ['#c99d37', '#b38827']);
      break;

    case 'brick':
    case 'bricks':
      drawIsometricBlock(ctx, ['#d35230', '#b94020'], ['#a03316', '#87280e'], ['#87280e', '#6e1d07'], (c) => {
        c.fillStyle = '#e2e8f0';
        c.fillRect(6, 16, 9, 1);
        c.fillRect(18, 17, 9, 1);
      });
      break;

    case 'glass':
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.fillRect(4, 4, 24, 24);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 24, 24);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 22);
      ctx.lineTo(22, 8);
      ctx.moveTo(14, 24);
      ctx.lineTo(24, 14);
      ctx.stroke();
      break;

    case 'bookshelf':
      drawIsometricBlock(ctx, ['#caa472', '#b38b58'], ['#9e7747', '#876337'], ['#876337', '#6e4f29'], (c) => {
        const bCols = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        for (let i = 0; i < 4; i++) {
          c.fillStyle = bCols[i];
          c.fillRect(6 + i * 2, 14, 2, 6);
        }
      });
      break;

    case 'crafting_table':
      drawIsometricBlock(ctx, ['#caa472', '#b38b58'], ['#876337', '#6e4f29'], ['#6e4f29', '#553d1e'], (c) => {
        c.strokeStyle = '#3e2712';
        c.lineWidth = 1;
        c.strokeRect(12, 7, 8, 6);
        c.beginPath();
        c.moveTo(16, 7);
        c.lineTo(16, 13);
        c.moveTo(12, 10);
        c.lineTo(20, 10);
        c.stroke();
      });
      break;

    case 'coal_ore':
    case 'iron_ore':
    case 'gold_ore':
    case 'diamond_ore': {
      const gemColors: Record<string, string> = {
        coal_ore: '#262626',
        iron_ore: '#d97706',
        gold_ore: '#fbbf24',
        diamond_ore: '#38bdf8',
      };
      const gemCol = gemColors[itemId] || '#38bdf8';
      drawIsometricBlock(ctx, ['#9e9e9e', '#8a8a8a'], ['#757575', '#616161'], ['#616161', '#424242'], (c) => {
        c.fillStyle = gemCol;
        c.fillRect(14, 8, 4, 3);
        c.fillRect(8, 16, 3, 3);
        c.fillRect(20, 16, 4, 3);
        c.fillRect(10, 22, 3, 2);
        c.fillStyle = '#ffffff';
        c.fillRect(15, 9, 1, 1);
        c.fillRect(21, 17, 1, 1);
      });
      break;
    }

    case 'snow':
      drawIsometricBlock(ctx, ['#ffffff', '#f1f5f9'], ['#e2e8f0', '#cbd5e1'], ['#cbd5e1', '#94a3b8']);
      break;

    case 'torch': {
      ctx.clearRect(0, 0, 32, 32);
      const grad = ctx.createRadialGradient(16, 8, 2, 16, 8, 10);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 8, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5c3d23';
      ctx.fillRect(14, 11, 4, 18);
      ctx.fillStyle = '#7c5230';
      ctx.fillRect(14, 11, 2, 18);

      ctx.fillStyle = '#262626';
      ctx.fillRect(13, 8, 6, 5);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(14, 5, 4, 5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(15, 4, 2, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, 3, 2, 2);
      break;
    }

    case 'pickaxe_wood':
    case 'wooden_pickaxe':
    case 'pickaxe_stone':
    case 'stone_pickaxe':
    case 'pickaxe_iron':
    case 'iron_pickaxe':
    case 'pickaxe_diamond':
    case 'diamond_pickaxe': {
      const headCols: Record<string, [string, string]> = {
        pickaxe_wood: ['#a16207', '#ca8a04'],
        wooden_pickaxe: ['#a16207', '#ca8a04'],
        pickaxe_stone: ['#64748b', '#94a3b8'],
        stone_pickaxe: ['#64748b', '#94a3b8'],
        pickaxe_iron: ['#cbd5e1', '#ffffff'],
        iron_pickaxe: ['#cbd5e1', '#ffffff'],
        pickaxe_diamond: ['#0284c7', '#38bdf8'],
        diamond_pickaxe: ['#0284c7', '#38bdf8'],
      };
      const [headDark, headLight] = headCols[itemId] || ['#64748b', '#94a3b8'];
      ctx.clearRect(0, 0, 32, 32);

      ctx.strokeStyle = '#5c3d23';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(7, 25);
      ctx.lineTo(21, 11);
      ctx.stroke();

      ctx.lineWidth = 3.5;
      ctx.strokeStyle = headDark;
      ctx.beginPath();
      ctx.moveTo(13, 6);
      ctx.lineTo(22, 9);
      ctx.lineTo(26, 17);
      ctx.stroke();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = headLight;
      ctx.beginPath();
      ctx.moveTo(14, 5);
      ctx.lineTo(22, 8);
      ctx.lineTo(25, 15);
      ctx.stroke();
      break;
    }

    case 'axe_wood':
    case 'wooden_axe':
    case 'axe_stone':
    case 'stone_axe':
    case 'axe_iron':
    case 'iron_axe':
    case 'axe_diamond':
    case 'diamond_axe': {
      const headCols: Record<string, [string, string]> = {
        axe_wood: ['#a16207', '#ca8a04'],
        wooden_axe: ['#a16207', '#ca8a04'],
        axe_stone: ['#64748b', '#94a3b8'],
        stone_axe: ['#64748b', '#94a3b8'],
        axe_iron: ['#cbd5e1', '#ffffff'],
        iron_axe: ['#cbd5e1', '#ffffff'],
        axe_diamond: ['#0284c7', '#38bdf8'],
        diamond_axe: ['#0284c7', '#38bdf8'],
      };
      const [headDark, headLight] = headCols[itemId] || ['#64748b', '#94a3b8'];
      ctx.clearRect(0, 0, 32, 32);

      ctx.strokeStyle = '#5c3d23';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(7, 25);
      ctx.lineTo(22, 10);
      ctx.stroke();

      ctx.fillStyle = headDark;
      ctx.beginPath();
      ctx.moveTo(17, 7);
      ctx.lineTo(27, 7);
      ctx.lineTo(27, 16);
      ctx.lineTo(20, 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = headLight;
      ctx.fillRect(25, 7, 2, 9);
      break;
    }

    case 'sword_wood':
    case 'wooden_sword':
    case 'sword_stone':
    case 'stone_sword':
    case 'sword_iron':
    case 'iron_sword':
    case 'sword_diamond':
    case 'diamond_sword': {
      const bladeCols: Record<string, [string, string]> = {
        sword_wood: ['#a16207', '#ca8a04'],
        wooden_sword: ['#a16207', '#ca8a04'],
        sword_stone: ['#64748b', '#94a3b8'],
        stone_sword: ['#64748b', '#94a3b8'],
        sword_iron: ['#cbd5e1', '#ffffff'],
        iron_sword: ['#cbd5e1', '#ffffff'],
        sword_diamond: ['#0284c7', '#38bdf8'],
        diamond_sword: ['#0284c7', '#38bdf8'],
      };
      const [bladeDark, bladeLight] = bladeCols[itemId] || ['#64748b', '#94a3b8'];
      ctx.clearRect(0, 0, 32, 32);

      ctx.lineWidth = 4;
      ctx.strokeStyle = bladeDark;
      ctx.beginPath();
      ctx.moveTo(11, 21);
      ctx.lineTo(25, 7);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = bladeLight;
      ctx.beginPath();
      ctx.moveTo(12, 20);
      ctx.lineTo(25, 7);
      ctx.stroke();

      ctx.fillStyle = '#3e2712';
      ctx.fillRect(9, 21, 6, 2);
      ctx.fillRect(11, 19, 2, 6);

      ctx.fillStyle = '#7c5230';
      ctx.fillRect(7, 24, 3, 3);
      break;
    }

    case 'stick': {
      ctx.clearRect(0, 0, 32, 32);
      ctx.strokeStyle = '#5c3d23';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 26);
      ctx.lineTo(26, 6);
      ctx.stroke();

      ctx.strokeStyle = '#8d5c27';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(7, 25);
      ctx.lineTo(25, 7);
      ctx.stroke();
      break;
    }

    case 'coal': {
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(8, 16);
      ctx.lineTo(16, 7);
      ctx.lineTo(24, 12);
      ctx.lineTo(22, 22);
      ctx.lineTo(12, 24);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#57534e';
      ctx.fillRect(14, 12, 4, 3);
      break;
    }

    case 'iron_ingot':
    case 'gold_ingot': {
      const isGold = itemId === 'gold_ingot';
      const main = isGold ? '#fbbf24' : '#e2e8f0';
      const dark = isGold ? '#b45309' : '#94a3b8';
      const light = isGold ? '#fef08a' : '#ffffff';

      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.moveTo(6, 18);
      ctx.lineTo(12, 11);
      ctx.lineTo(24, 11);
      ctx.lineTo(20, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = light;
      ctx.fillRect(13, 12, 9, 2);

      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(6, 18);
      ctx.lineTo(20, 18);
      ctx.lineTo(18, 23);
      ctx.lineTo(4, 23);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'diamond': {
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(16, 5);
      ctx.lineTo(26, 13);
      ctx.lineTo(16, 27);
      ctx.lineTo(6, 13);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(16, 5);
      ctx.lineTo(21, 13);
      ctx.lineTo(16, 20);
      ctx.lineTo(11, 13);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 8, 2, 2);
      break;
    }

    default:
      drawIsometricBlock(ctx, [color, color], [color, color], [color, color]);
      break;
  }

  const url = canvas.toDataURL('image/png');
  spriteCache[itemId] = url;
  return url;
}

// Primary item sprite retriever: attempts to return PNG resource URL or falls back to canvas sprite
export function getItemSprite(itemId: string): string {
  if (ITEM_RESOURCE_MAP[itemId]) {
    return ITEM_RESOURCE_MAP[itemId];
  }
  return getItemFallbackSprite(itemId);
}
