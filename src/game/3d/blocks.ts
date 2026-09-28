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
  textures: [number, number, number, number, number, number];
  color: string;
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: { id: BlockType.AIR, name: 'Air', hardness: 0, soundType: 'dirt', transparent: true, dropId: BlockType.AIR, dropCount: 0, textures: [0,0,0,0,0,0], color: '#000000' },
  [BlockType.GRASS]: { id: BlockType.GRASS, name: 'Grass Block', hardness: 0.6, soundType: 'grass', dropId: BlockType.DIRT, dropCount: 1, textures: [0,2,1,1,1,1], color: '#4caf50' },
  [BlockType.DIRT]: { id: BlockType.DIRT, name: 'Dirt', hardness: 0.5, soundType: 'dirt', dropId: BlockType.DIRT, dropCount: 1, textures: [2,2,2,2,2,2], color: '#795548' },
  [BlockType.STONE]: { id: BlockType.STONE, name: 'Stone', hardness: 1.5, soundType: 'stone', dropId: BlockType.COBBLESTONE, dropCount: 1, textures: [3,3,3,3,3,3], color: '#9e9e9e' },
  [BlockType.COBBLESTONE]: { id: BlockType.COBBLESTONE, name: 'Cobblestone', hardness: 1.8, soundType: 'stone', dropId: BlockType.COBBLESTONE, dropCount: 1, textures: [4,4,4,4,4,4], color: '#757575' },
  [BlockType.WOOD]: { id: BlockType.WOOD, name: 'Oak Log', hardness: 1.2, soundType: 'wood', dropId: BlockType.WOOD, dropCount: 1, textures: [6,6,5,5,5,5], color: '#6d4c41' },
  [BlockType.LEAVES]: { id: BlockType.LEAVES, name: 'Oak Leaves', hardness: 0.3, soundType: 'grass', transparent: true, dropId: BlockType.LEAVES, dropCount: 1, textures: [7,7,7,7,7,7], color: '#2e7d32' },
  [BlockType.PLANKS]: { id: BlockType.PLANKS, name: 'Oak Planks', hardness: 1.0, soundType: 'wood', dropId: BlockType.PLANKS, dropCount: 1, textures: [8,8,8,8,8,8], color: '#d7ccc8' },
  [BlockType.SAND]: { id: BlockType.SAND, name: 'Sand', hardness: 0.5, soundType: 'sand', dropId: BlockType.SAND, dropCount: 1, textures: [9,9,9,9,9,9], color: '#fbc02d' },
  [BlockType.WATER]: { id: BlockType.WATER, name: 'Water', hardness: 999, soundType: 'sand', transparent: true, dropId: BlockType.AIR, dropCount: 0, textures: [10,10,10,10,10,10], color: '#29b6f6' },
  [BlockType.GLASS]: { id: BlockType.GLASS, name: 'Glass', hardness: 0.3, soundType: 'glass', transparent: true, dropId: BlockType.GLASS, dropCount: 1, textures: [11,11,11,11,11,11], color: '#e0f7fa' },
  [BlockType.BRICK]: { id: BlockType.BRICK, name: 'Bricks', hardness: 2.0, soundType: 'stone', dropId: BlockType.BRICK, dropCount: 1, textures: [12,12,12,12,12,12], color: '#b71c1c' },
  [BlockType.COAL_ORE]: { id: BlockType.COAL_ORE, name: 'Coal Ore', hardness: 2.2, soundType: 'stone', dropId: BlockType.COAL_ORE, dropCount: 1, textures: [13,13,13,13,13,13], color: '#424242' },
  [BlockType.IRON_ORE]: { id: BlockType.IRON_ORE, name: 'Iron Ore', hardness: 2.5, soundType: 'stone', dropId: BlockType.IRON_ORE, dropCount: 1, textures: [14,14,14,14,14,14], color: '#d1c4e9' },
  [BlockType.GOLD_ORE]: { id: BlockType.GOLD_ORE, name: 'Gold Ore', hardness: 2.8, soundType: 'stone', dropId: BlockType.GOLD_ORE, dropCount: 1, textures: [15,15,15,15,15,15], color: '#ffd54f' },
  [BlockType.DIAMOND_ORE]: { id: BlockType.DIAMOND_ORE, name: 'Diamond Ore', hardness: 3.2, soundType: 'stone', dropId: BlockType.DIAMOND_ORE, dropCount: 1, textures: [16,16,16,16,16,16], color: '#00e5ff' },
  [BlockType.TORCH]: { id: BlockType.TORCH, name: 'Torch', hardness: 0.1, soundType: 'wood', transparent: true, lightLevel: 14, dropId: BlockType.TORCH, dropCount: 1, textures: [17,17,17,17,17,17], color: '#ffb300' },
  [BlockType.CRAFTING_TABLE]: { id: BlockType.CRAFTING_TABLE, name: 'Crafting Table', hardness: 1.5, soundType: 'wood', dropId: BlockType.CRAFTING_TABLE, dropCount: 1, textures: [18,8,19,19,19,19], color: '#8d6e63' },
  [BlockType.BOOKSHELF]: { id: BlockType.BOOKSHELF, name: 'Bookshelf', hardness: 1.2, soundType: 'wood', dropId: BlockType.BOOKSHELF, dropCount: 1, textures: [8,8,20,20,20,20], color: '#a1887f' },
  [BlockType.SNOW]: { id: BlockType.SNOW, name: 'Snow Block', hardness: 0.4, soundType: 'dirt', dropId: BlockType.SNOW, dropCount: 1, textures: [21,2,21,21,21,21], color: '#ffffff' },
  [BlockType.STONE_BRICKS]: { id: BlockType.STONE_BRICKS, name: 'Stone Bricks', hardness: 1.8, soundType: 'stone', dropId: BlockType.STONE_BRICKS, dropCount: 1, textures: [22,22,22,22,22,22], color: '#757575' },
};

export function createVoxelTextureAtlas(): { texture: THREE.CanvasTexture; material: THREE.MeshStandardMaterial; waterMaterial: THREE.MeshStandardMaterial } {
  const tileSize = 16;
  const atlasCols = 8;
  const atlasRows = 8;
  const canvas = document.createElement('canvas');
  canvas.width = tileSize * atlasCols;
  canvas.height = tileSize * atlasRows;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  function drawTile(index: number, drawFn: (cx: CanvasRenderingContext2D, x: number, y: number) => void) {
    const col = index % atlasCols;
    const row = Math.floor(index / atlasCols);
    ctx.save();
    ctx.translate(col * tileSize, row * tileSize);
    drawFn(ctx, 0, 0);
    ctx.restore();
  }

  drawTile(0, (c) => {
    c.fillStyle = '#4ca64c'; c.fillRect(0,0,16,16);
    const greens = ['#3f923f','#56b856','#439d43','#5bc25b','#368136'];
    for (let py=0;py<16;py++) for (let px=0;px<16;px++) if ((px*7+py*13)%3===0) { c.fillStyle=greens[(px+py)%greens.length]; c.fillRect(px,py,1,1); }
  });
  drawTile(1, (c) => {
    c.fillStyle='#866043'; c.fillRect(0,0,16,16);
    const dirtSpecks=['#734f36','#9c7050','#63442e'];
    for (let py=4;py<16;py++) for (let px=0;px<16;px++) if ((px*11+py*17)%4===0) { c.fillStyle=dirtSpecks[(px*3+py)%dirtSpecks.length]; c.fillRect(px,py,1,1); }
    c.fillStyle='#4ca64c'; c.fillRect(0,0,16,3);
    const fringe=[3,4,3,5,4,3,4,5,3,4,5,4,3,4,3,4];
    for (let px=0;px<16;px++) { const h=fringe[px]; c.fillRect(px,0,1,h); if(h>=4){c.fillStyle='#3f923f';c.fillRect(px,h-1,1,1);c.fillStyle='#4ca64c';} }
  });
  drawTile(2, (c) => {
    c.fillStyle='#866043'; c.fillRect(0,0,16,16);
    const browns=['#734f36','#9c7050','#63442e','#91674a'];
    for(let py=0;py<16;py++) for(let px=0;px<16;px++) if((px*7+py*13)%3===0){c.fillStyle=browns[(px*2+py*5)%browns.length];c.fillRect(px,py,1,1);}
  });
  drawTile(3, (c) => {
    c.fillStyle='#7a7a7a'; c.fillRect(0,0,16,16); const grays=['#6a6a6a','#8a8a8a','#5a5a5a','#949494'];
    for(let py=0;py<16;py++) for(let px=0;px<16;px++) if((px*5+py*11)%3===0){c.fillStyle=grays[(px*3+py*7)%grays.length];c.fillRect(px,py,1,1);}
  });
  drawTile(4, (c) => {
    c.fillStyle='#555555'; c.fillRect(0,0,16,16);
    const pebbles=[{x:0,y:0,w:7,h:4},{x:8,y:0,w:8,h:5},{x:0,y:5,w:9,h:5},{x:10,y:6,w:6,h:4},{x:0,y:11,w:7,h:5},{x:8,y:11,w:8,h:5}];
    for(const p of pebbles){c.fillStyle='#787878';c.fillRect(p.x,p.y,p.w,p.h);c.fillStyle='#909090';c.fillRect(p.x+1,p.y+1,p.w-2,1);c.fillStyle='#3a3a3a';c.fillRect(p.x,p.y+p.h-1,p.w,1);c.fillRect(p.x+p.w-1,p.y,1,p.h);}
  });
  drawTile(5, (c) => {
    c.fillStyle='#5c4033'; c.fillRect(0,0,16,16); const barkShades=['#4a3328','#6d4c3d','#3f2b22','#7a5544'];
    for(let px=0;px<16;px++){c.fillStyle=barkShades[px%barkShades.length];c.fillRect(px,0,1,16);} c.fillStyle='#332219';c.fillRect(3,4,2,3);c.fillRect(11,10,2,3);
  });
  drawTile(6, (c) => {
    c.fillStyle='#9e7e5a'; c.fillRect(0,0,16,16); c.fillStyle='#4a3328'; c.strokeRect(.5,.5,15,15); c.strokeRect(1.5,1.5,13,13); c.fillStyle='#826343';c.strokeRect(4.5,4.5,7,7);c.fillStyle='#6a4e32';c.fillRect(7,7,2,2);
  });
  drawTile(7, (c) => {
    c.fillStyle='#2e7d32';c.fillRect(0,0,16,16);const leafColors=['#1b5e20','#388e3c','#43a047','#256d29','#154a19'];
    for(let py=0;py<16;py++) for(let px=0;px<16;px++) if((px*3+py*7)%2===0){c.fillStyle=leafColors[(px*5+py*11)%leafColors.length];c.fillRect(px,py,1,1);}
  });
  drawTile(8, (c) => {
    c.fillStyle='#b88a44';c.fillRect(0,0,16,16);for(let i=0;i<4;i++){const y=i*4;c.fillStyle='#8c642e';c.fillRect(0,y+3,16,1);c.fillStyle='#cf9e55';c.fillRect(0,y,16,1);const seamX=i%2===0?7:12;c.fillStyle='#735224';c.fillRect(seamX,y,1,4);}
  });
  drawTile(9, (c) => {
    c.fillStyle='#e6c875';c.fillRect(0,0,16,16);const sands=['#d9b863','#f2d78a','#cca952','#f7e19e'];for(let py=0;py<16;py++)for(let px=0;px<16;px++)if((px*9+py*13)%3===0){c.fillStyle=sands[(px+py*3)%sands.length];c.fillRect(px,py,1,1);}
  });
  drawTile(10, (c) => {
    c.fillStyle='#2196f3';c.fillRect(0,0,16,16);c.fillStyle='#64b5f6';for(let y=1;y<16;y+=4)for(let x=0;x<16;x+=3)c.fillRect(x,y,2,1);c.fillStyle='#1976d2';for(let y=3;y<16;y+=4)for(let x=1;x<16;x+=3)c.fillRect(x,y,2,1);
  });
  drawTile(11, (c) => {
    c.fillStyle='rgba(210,240,255,.45)';c.fillRect(0,0,16,16);c.fillStyle='rgba(255,255,255,.9)';c.strokeRect(.5,.5,15,15);c.fillRect(2,2,2,1);c.fillRect(3,3,3,1);c.fillRect(5,4,3,1);c.fillRect(11,10,2,1);c.fillRect(12,11,2,1);
  });
  drawTile(12, (c) => {
    c.fillStyle='#d3d3d3';c.fillRect(0,0,16,16);for(let r=0;r<4;r++){const y=r*4,offset=r%2*4;for(let cidx=-1;cidx<3;cidx++){const x=cidx*8+offset;c.fillStyle='#9e3f32';c.fillRect(x,y,7,3);c.fillStyle='#b74c3d';c.fillRect(x,y,6,1);c.fillStyle='#7a2f24';c.fillRect(x,y+2,7,1);}}
  });
  function drawOre(index:number,gemColor:string,gemLight:string,gemDark:string){drawTile(index,(c)=>{c.fillStyle='#7a7a7a';c.fillRect(0,0,16,16);const grays=['#6a6a6a','#8a8a8a','#5a5a5a'];for(let py=0;py<16;py++)for(let px=0;px<16;px++)if((px*5+py*11)%3===0){c.fillStyle=grays[(px*3+py*7)%grays.length];c.fillRect(px,py,1,1);}const flecks=[{x:3,y:3},{x:4,y:3},{x:3,y:4},{x:10,y:4},{x:11,y:4},{x:11,y:5},{x:5,y:10},{x:6,y:10},{x:6,y:11},{x:5,y:11},{x:12,y:11},{x:13,y:11}];for(const f of flecks){c.fillStyle=gemColor;c.fillRect(f.x,f.y,1,1);}c.fillStyle=gemLight;c.fillRect(3,3,1,1);c.fillRect(10,4,1,1);c.fillRect(5,10,1,1);c.fillStyle=gemDark;c.fillRect(4,4,1,1);c.fillRect(6,11,1,1);});}
  drawOre(13,'#262626','#3b3b3b','#121212');
  drawOre(14,'#d8af92','#f3d3bc','#b3886b');
  drawOre(15,'#fdd835','#fff59d','#f57f17');
  drawOre(16,'#00e5ff','#84ffff','#00b0ff');
  drawTile(17, (c) => {c.clearRect(0,0,16,16);c.fillStyle='#6d4c41';c.fillRect(7,6,2,8);c.fillStyle='#ff9800';c.fillRect(6,3,4,4);c.fillStyle='#ffeb3b';c.fillRect(7,2,2,3);c.fillStyle='#fff';c.fillRect(7,3,1,1);});
  drawTile(18, (c) => {c.fillStyle='#b88a44';c.fillRect(0,0,16,16);c.fillStyle='#5c4033';c.strokeRect(2.5,2.5,11,11);c.fillRect(6,3,1,10);c.fillRect(10,3,1,10);c.fillRect(3,6,10,1);c.fillRect(3,10,10,1);});
  drawTile(19, (c) => {c.fillStyle='#b88a44';c.fillRect(0,0,16,16);c.fillStyle='#5c4033';c.fillRect(1,1,14,14);c.fillStyle='#b88a44';c.fillRect(2,2,12,12);c.fillStyle='#7a7a7a';c.fillRect(4,4,4,2);c.fillStyle='#6d4c41';c.fillRect(5,6,2,6);});
  drawTile(20, (c) => {c.fillStyle='#b88a44';c.fillRect(0,0,16,16);const bookColors=['#d32f2f','#1976d2','#388e3c','#fbc02d','#7b1fa2','#e64a19'];for(const rowY of [2,9]){c.fillStyle='#3e2723';c.fillRect(1,rowY,14,5);let bx=2,ci=0;while(bx<14){const bw=Math.min(2,14-bx);c.fillStyle=bookColors[ci%bookColors.length];c.fillRect(bx,rowY+1,bw,4);c.fillStyle='#fff';c.fillRect(bx,rowY+2,1,1);bx+=bw+1;ci++;}}});
  drawTile(21, (c) => {c.fillStyle='#f5f5f5';c.fillRect(0,0,16,16);c.fillStyle='#fff';for(let py=0;py<16;py++)for(let px=0;px<16;px++)if((px+py)%2===0)c.fillRect(px,py,1,1);c.fillStyle='#e0e0e0';c.fillRect(3,4,1,1);c.fillRect(11,8,1,1);});
  drawTile(22, (c) => {c.fillStyle='#4a4a4a';c.fillRect(0,0,16,16);for(let row=0;row<2;row++){const y=row*8,off=row*4;for(let col=-1;col<3;col++){const x=col*8+off;c.fillStyle='#7a7a7a';c.fillRect(x,y,7,7);c.fillStyle='#949494';c.fillRect(x,y,6,1);c.fillStyle='#616161';c.fillRect(x,y+6,7,1);}}});

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  // Replace the procedural grass tiles with the actual SVG resources from public/assets/blocks.
  // This keeps the existing atlas/UV system intact while making the committed SVGs the real in-game textures.
  const grassAssets: Array<[number, string]> = [
    [0, '/assets/blocks/grass_block_top.svg'],
    [1, '/assets/blocks/grass_block_side.svg'],
    [2, '/assets/blocks/grass_block_bottom.svg'],
  ];
  Promise.all(grassAssets.map(([index, src]) => new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const col = index % atlasCols;
      const row = Math.floor(index / atlasCols);
      ctx.clearRect(col * tileSize, row * tileSize, tileSize, tileSize);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, col * tileSize, row * tileSize, tileSize, tileSize);
      resolve();
    };
    image.onerror = () => resolve();
    image.src = src;
  }))).then(() => {
    texture.needsUpdate = true;
  });

  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, metalness: 0.1, alphaTest: 0.5 });
  const waterMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.72 });
  return { texture, material, waterMaterial };
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