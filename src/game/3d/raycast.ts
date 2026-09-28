// ============================================================
// RAYCAST - Fast 3D Voxel DDA Raycaster for mining and placing
// ============================================================
import { BlockType } from './blocks';
import { World3D } from './world3d';

export interface VoxelRaycastHit {
  hit: boolean;
  x: number;
  y: number;
  z: number;
  type: BlockType;
  face: { nx: number; ny: number; nz: number };
  placePos: { x: number; y: number; z: number };
  distance: number;
}

export function raycastVoxels(
  world: World3D,
  originX: number,
  originY: number,
  originZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  maxDistance = 6.0
): VoxelRaycastHit | null {
  // Normalize direction
  const len = Math.hypot(dirX, dirY, dirZ);
  if (len === 0) return null;
  const dx = dirX / len;
  const dy = dirY / len;
  const dz = dirZ / len;

  let x = Math.floor(originX);
  let y = Math.floor(originY);
  let z = Math.floor(originZ);

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const stepZ = Math.sign(dz);

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity;

  let tMaxX = stepX > 0 ? (Math.floor(originX) + 1 - originX) * tDeltaX : (originX - Math.floor(originX)) * tDeltaX;
  let tMaxY = stepY > 0 ? (Math.floor(originY) + 1 - originY) * tDeltaY : (originY - Math.floor(originY)) * tDeltaY;
  let tMaxZ = stepZ > 0 ? (Math.floor(originZ) + 1 - originZ) * tDeltaZ : (originZ - Math.floor(originZ)) * tDeltaZ;

  let nx = 0;
  let ny = 0;
  let nz = 0;
  let dist = 0;

  while (dist < maxDistance) {
    const block = world.getBlock(x, y, z);
    // Hit a non-air, non-water block
    if (block !== BlockType.AIR && block !== BlockType.WATER) {
      return {
        hit: true,
        x,
        y,
        z,
        type: block,
        face: { nx, ny, nz },
        placePos: { x: x + nx, y: y + ny, z: z + nz },
        distance: dist,
      };
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        dist = tMaxX;
        x += stepX;
        tMaxX += tDeltaX;
        nx = -stepX;
        ny = 0;
        nz = 0;
      } else {
        dist = tMaxZ;
        z += stepZ;
        tMaxZ += tDeltaZ;
        nx = 0;
        ny = 0;
        nz = -stepZ;
      }
    } else {
      if (tMaxY < tMaxZ) {
        dist = tMaxY;
        y += stepY;
        tMaxY += tDeltaY;
        nx = 0;
        ny = -stepY;
        nz = 0;
      } else {
        dist = tMaxZ;
        z += stepZ;
        tMaxZ += tDeltaZ;
        nx = 0;
        ny = 0;
        nz = -stepZ;
      }
    }
  }

  return null;
}
