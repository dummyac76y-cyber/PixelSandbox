// ============================================================
// WORLD 3D - High-performance chunk-based 3D Voxel Engine
// ============================================================
import * as THREE from 'three';
import { BlockType, BLOCK_DEFS, getAtlasUVs } from './blocks';
import { PerlinNoise } from './noise';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_SIZE_Y = 32;
export const SEA_LEVEL = 10;

export interface ChunkKey {
  cx: number;
  cz: number;
}

export class Chunk {
  cx: number;
  cz: number;
  blocks: Uint8Array; // 16 * 16 * 32 bytes
  mesh: THREE.Mesh | null = null;
  waterMesh: THREE.Mesh | null = null;
  isDirty = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Z * CHUNK_SIZE_Y);
  }

  getIndex(lx: number, ly: number, lz: number): number {
    return lx + lz * CHUNK_SIZE_X + ly * (CHUNK_SIZE_X * CHUNK_SIZE_Z);
  }

  getBlock(lx: number, ly: number, lz: number): BlockType {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_SIZE_Y || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.blocks[this.getIndex(lx, ly, lz)] as BlockType;
  }

  setBlock(lx: number, ly: number, lz: number, type: BlockType): void {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_SIZE_Y || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return;
    }
    this.blocks[this.getIndex(lx, ly, lz)] = type;
    this.isDirty = true;
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
  }
}

export class World3D {
  scene: THREE.Scene;
  material: THREE.MeshStandardMaterial;
  waterMaterial: THREE.MeshStandardMaterial;
  chunks: Map<string, Chunk> = new Map();
  modifiedBlocks: Map<string, BlockType> = new Map();
  noise: PerlinNoise;
  oreNoise: PerlinNoise;
  treeNoise: PerlinNoise;
  renderRadius = 2; // 5x5 chunks around player
  saveKey = 'pixel_sandbox_3d_modifications';

  constructor(scene: THREE.Scene, material: THREE.MeshStandardMaterial, waterMaterial: THREE.MeshStandardMaterial) {
    this.scene = scene;
    this.material = material;
    this.waterMaterial = waterMaterial;
    this.noise = new PerlinNoise(4242);
    this.oreNoise = new PerlinNoise(9876);
    this.treeNoise = new PerlinNoise(1234);
    this.loadSavedModifications();
  }

  getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  getBlockKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private loadSavedModifications(): void {
    try {
      const data = localStorage.getItem(this.saveKey);
      if (data) {
        const parsed = JSON.parse(data);
        for (const [k, v] of Object.entries(parsed)) {
          this.modifiedBlocks.set(k, v as BlockType);
        }
      }
    } catch {
      // LocalStorage unavailable
    }
  }

  saveModifications(): void {
    try {
      const obj: Record<string, number> = {};
      for (const [k, v] of this.modifiedBlocks.entries()) {
        obj[k] = v;
      }
      localStorage.setItem(this.saveKey, JSON.stringify(obj));
    } catch {
      // Ignore
    }
  }

  resetModifications(): void {
    this.modifiedBlocks.clear();
    try {
      localStorage.removeItem(this.saveKey);
    } catch {
      // Ignore
    }
    // Re-generate loaded chunks
    for (const chunk of this.chunks.values()) {
      chunk.dispose();
      if (chunk.mesh) this.scene.remove(chunk.mesh);
      if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);
    }
    this.chunks.clear();
  }

  // Get block at global coordinate (never triggers recursive mesh building)
  getBlock(x: number, y: number, z: number): BlockType {
    if (y < 0 || y >= CHUNK_SIZE_Y) return BlockType.AIR;

    // Check if player placed or broke this block
    const bKey = this.getBlockKey(x, y, z);
    if (this.modifiedBlocks.has(bKey)) {
      return this.modifiedBlocks.get(bKey)!;
    }

    const cx = Math.floor(x / CHUNK_SIZE_X);
    const cz = Math.floor(z / CHUNK_SIZE_Z);
    const lx = ((x % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((z % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    // Pass buildMesh = false to prevent infinite recursion during chunk meshing!
    const chunk = this.getChunk(cx, cz, false);
    return chunk.getBlock(lx, y, lz);
  }

  // Place or break block
  setBlock(x: number, y: number, z: number, type: BlockType): boolean {
    if (y < 0 || y >= CHUNK_SIZE_Y) return false;

    const bKey = this.getBlockKey(x, y, z);
    this.modifiedBlocks.set(bKey, type);
    this.saveModifications();

    const cx = Math.floor(x / CHUNK_SIZE_X);
    const cz = Math.floor(z / CHUNK_SIZE_Z);
    const lx = ((x % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((z % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    const chunk = this.getChunk(cx, cz, true);
    chunk.setBlock(lx, y, lz, type);
    this.buildChunkMesh(chunk);

    // If block is on the edge of a chunk, update the neighbor chunk
    if (lx === 0) this.updateNeighbor(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) this.updateNeighbor(cx + 1, cz);
    if (lz === 0) this.updateNeighbor(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.updateNeighbor(cx, cz + 1);

    return true;
  }

  private updateNeighbor(cx: number, cz: number): void {
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (chunk) {
      this.buildChunkMesh(chunk);
    }
  }

  getChunk(cx: number, cz: number, buildMesh = true): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = this.generateChunk(cx, cz);
      this.chunks.set(key, chunk);
      if (buildMesh) {
        this.buildChunkMesh(chunk);
      }
    } else if (buildMesh && !chunk.mesh) {
      this.buildChunkMesh(chunk);
    }
    return chunk;
  }

  // Generate terrain data for a 16x16x32 chunk
  private generateChunk(cx: number, cz: number): Chunk {
    const chunk = new Chunk(cx, cz);
    const startX = cx * CHUNK_SIZE_X;
    const startZ = cz * CHUNK_SIZE_Z;

    // First pass: generate terrain heights and base blocks
    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        // Multi-octave terrain height
        const continental = this.noise.octave2D(wx * 0.015, wz * 0.015, 3, 0.5);
        const hills = this.noise.octave2D(wx * 0.04, wz * 0.04, 3, 0.5);
        const detail = this.noise.octave2D(wx * 0.1, wz * 0.1, 2, 0.5);

        // Height ranges from 8 to 26
        const baseHeight = 13 + continental * 8 + hills * 4 + detail * 2;
        const height = Math.floor(Math.max(6, Math.min(27, baseHeight)));

        // Bedrock
        chunk.setBlock(lx, 0, lz, BlockType.STONE);

        // Underground & Surface
        for (let y = 1; y <= height; y++) {
          let bType = BlockType.STONE;

          if (y === height) {
            // Surface
            if (y <= SEA_LEVEL + 1) {
              bType = BlockType.SAND;
            } else if (y >= 23) {
              bType = BlockType.SNOW;
            } else {
              bType = BlockType.GRASS;
            }
          } else if (y >= height - 3) {
            // Sub-surface
            bType = y <= SEA_LEVEL + 1 ? BlockType.SAND : BlockType.DIRT;
          } else {
            // Underground ores
            const oreVal = this.oreNoise.noise3D(wx * 0.15, y * 0.2, wz * 0.15);
            if (y <= 5 && oreVal > 0.72) {
              bType = BlockType.DIAMOND_ORE;
            } else if (y <= 10 && oreVal > 0.65) {
              bType = BlockType.GOLD_ORE;
            } else if (y <= 16 && oreVal > 0.55) {
              bType = BlockType.IRON_ORE;
            } else if (oreVal > 0.50) {
              bType = BlockType.COAL_ORE;
            } else {
              bType = BlockType.STONE;
            }
          }

          chunk.setBlock(lx, y, lz, bType);
        }

        // Water up to sea level
        if (height < SEA_LEVEL) {
          for (let y = height + 1; y <= SEA_LEVEL; y++) {
            chunk.setBlock(lx, y, lz, BlockType.WATER);
          }
        }
      }
    }

    // Second pass: Trees on grass
    for (let lx = 2; lx < CHUNK_SIZE_X - 2; lx++) {
      for (let lz = 2; lz < CHUNK_SIZE_Z - 2; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        // Tree frequency noise
        const tVal = this.treeNoise.noise2D(wx * 0.2, wz * 0.2);
        if (tVal > 0.62) {
          // Find surface height
          let surfaceY = -1;
          for (let y = CHUNK_SIZE_Y - 1; y >= 1; y--) {
            if (chunk.getBlock(lx, y, lz) === BlockType.GRASS) {
              surfaceY = y;
              break;
            }
          }

          if (surfaceY > SEA_LEVEL + 1 && surfaceY + 6 < CHUNK_SIZE_Y) {
            // Trunk (4 blocks high)
            for (let ty = 1; ty <= 4; ty++) {
              chunk.setBlock(lx, surfaceY + ty, lz, BlockType.WOOD);
            }
            // Leaves (3x3 canopy around top and 1 cap)
            for (let dx = -2; dx <= 2; dx++) {
              for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 3; dy <= 4; dy++) {
                  if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy === 4) continue;
                  const current = chunk.getBlock(lx + dx, surfaceY + dy, lz + dz);
                  if (current === BlockType.AIR) {
                    chunk.setBlock(lx + dx, surfaceY + dy, lz + dz, BlockType.LEAVES);
                  }
                }
              }
            }
            // Top leaf cluster
            for (let dx = -1; dx <= 1; dx++) {
              for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
                const current = chunk.getBlock(lx + dx, surfaceY + 5, lz + dz);
                if (current === BlockType.AIR) {
                  chunk.setBlock(lx + dx, surfaceY + 5, lz + dz, BlockType.LEAVES);
                }
              }
            }
          }
        }
      }
    }

    // Apply player's saved modifications for this chunk
    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
          const bKey = this.getBlockKey(wx, y, wz);
          if (this.modifiedBlocks.has(bKey)) {
            chunk.setBlock(lx, y, lz, this.modifiedBlocks.get(bKey)!);
          }
        }
      }
    }

    return chunk;
  }

  // Build optimized geometry for chunk with face-culling and AO
  buildChunkMesh(chunk: Chunk): void {
    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    // Arrays for opaque mesh
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    // Arrays for water mesh
    const wPositions: number[] = [];
    const wNormals: number[] = [];
    const wUvs: number[] = [];

    // Helper: is block transparent
    const isTrans = (bx: number, by: number, bz: number): boolean => {
      if (by < 0 || by >= CHUNK_SIZE_Y) return true;
      const b = this.getBlock(bx, by, bz);
      if (b === BlockType.AIR) return true;
      return BLOCK_DEFS[b]?.transparent === true;
    };

    // Helper: compute ambient occlusion (0.5 to 1.0)
    const computeAO = (side1: boolean, side2: boolean, corner: boolean): number => {
      if (side1 && side2) return 0.5; // two adjacent solid blocks
      return 1.0 - (Number(side1) + Number(side2) + Number(corner)) * 0.15;
    };

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
          const b = chunk.getBlock(lx, y, lz);
          if (b === BlockType.AIR) continue;

          const wx = startX + lx;
          const wz = startZ + lz;
          const def = BLOCK_DEFS[b];
          if (!def) continue;

          const isWater = b === BlockType.WATER;

          // Render slender 3D torch post instead of a 1x1x1 cube block
          if (b === BlockType.TORCH) {
            const cx = wx + 0.5;
            const cz = wz + 0.5;
            const hw = 0.07;
            const x0 = cx - hw;
            const x1 = cx + hw;
            const z0 = cz - hw;
            const z1 = cz + hw;
            const y0 = y;
            const y1 = y + 0.65;

            const { u0, v0, u1, v1 } = getAtlasUVs(17);

            // Top face
            positions.push(
              x0, y1, z0,  x1, y1, z0,  x1, y1, z1,
              x0, y1, z0,  x1, y1, z1,  x0, y1, z1
            );
            normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
            uvs.push(u0, v1, u1, v1, u1, v0, u0, v1, u1, v0, u0, v0);
            for (let i = 0; i < 6; i++) colors.push(1, 1, 1);

            // Front (+Z)
            positions.push(
              x0, y0, z1,  x1, y0, z1,  x1, y1, z1,
              x0, y0, z1,  x1, y1, z1,  x0, y1, z1
            );
            normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
            uvs.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
            for (let i = 0; i < 6; i++) colors.push(1, 1, 1);

            // Back (-Z)
            positions.push(
              x1, y0, z0,  x0, y0, z0,  x0, y1, z0,
              x1, y0, z0,  x0, y1, z0,  x1, y1, z0
            );
            normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            uvs.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
            for (let i = 0; i < 6; i++) colors.push(1, 1, 1);

            // Left (-X)
            positions.push(
              x0, y0, z0,  x0, y0, z1,  x0, y1, z1,
              x0, y0, z0,  x0, y1, z1,  x0, y1, z0
            );
            normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
            uvs.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
            for (let i = 0; i < 6; i++) colors.push(1, 1, 1);

            // Right (+X)
            positions.push(
              x1, y0, z1,  x1, y0, z0,  x1, y1, z0,
              x1, y0, z1,  x1, y1, z0,  x1, y1, z1
            );
            normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
            uvs.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
            for (let i = 0; i < 6; i++) colors.push(1, 1, 1);

            continue;
          }

          // Faces to check:
          // 0: +Y (top), 1: -Y (bottom), 2: -X (left), 3: +X (right), 4: +Z (front), 5: -Z (back)
          const faces = [
            { nx: 0, ny: 1, nz: 0, faceIdx: 0, bCheck: isTrans(wx, y + 1, wz) },
            { nx: 0, ny: -1, nz: 0, faceIdx: 1, bCheck: y > 0 && isTrans(wx, y - 1, wz) },
            { nx: -1, ny: 0, nz: 0, faceIdx: 2, bCheck: isTrans(wx - 1, y, wz) },
            { nx: 1, ny: 0, nz: 0, faceIdx: 3, bCheck: isTrans(wx + 1, y, wz) },
            { nx: 0, ny: 0, nz: 1, faceIdx: 4, bCheck: isTrans(wx, y, wz + 1) },
            { nx: 0, ny: 0, nz: -1, faceIdx: 5, bCheck: isTrans(wx, y, wz - 1) },
          ];

          for (const f of faces) {
            // For water, don't render face if neighbor is also water
            if (isWater) {
              const neighbor = this.getBlock(wx + f.nx, y + f.ny, wz + f.nz);
              if (neighbor === BlockType.WATER) continue;
              if (!f.bCheck) continue;
            } else {
              if (!f.bCheck) continue;
            }

            const texIndex = def.textures[f.faceIdx];
            const { u0, v0, u1, v1 } = getAtlasUVs(texIndex);

            // Compute face corners and normals
            let p0: [number, number, number];
            let p1: [number, number, number];
            let p2: [number, number, number];
            let p3: [number, number, number];

            // Ambient occlusion factors for 4 vertices
            let ao0 = 1.0;
            let ao1 = 1.0;
            let ao2 = 1.0;
            let ao3 = 1.0;

            const x0 = wx;
            const x1 = wx + 1;
            const y0 = y;
            const y1 = isWater && f.faceIdx === 0 ? y + 0.88 : y + 1; // slight water drop
            const z0 = wz;
            const z1 = wz + 1;

            if (f.faceIdx === 0) {
              // +Y Top
              p0 = [x0, y1, z1];
              p1 = [x1, y1, z1];
              p2 = [x1, y1, z0];
              p3 = [x0, y1, z0];

              if (!isWater) {
                const sL = !isTrans(wx - 1, y + 1, wz);
                const sR = !isTrans(wx + 1, y + 1, wz);
                const sB = !isTrans(wx, y + 1, wz - 1);
                const sF = !isTrans(wx, y + 1, wz + 1);
                ao0 = computeAO(sL, sF, !isTrans(wx - 1, y + 1, wz + 1));
                ao1 = computeAO(sR, sF, !isTrans(wx + 1, y + 1, wz + 1));
                ao2 = computeAO(sR, sB, !isTrans(wx + 1, y + 1, wz - 1));
                ao3 = computeAO(sL, sB, !isTrans(wx - 1, y + 1, wz - 1));
              }
            } else if (f.faceIdx === 1) {
              // -Y Bottom
              p0 = [x0, y0, z0];
              p1 = [x1, y0, z0];
              p2 = [x1, y0, z1];
              p3 = [x0, y0, z1];
            } else if (f.faceIdx === 2) {
              // -X Left
              p0 = [x0, y0, z0];
              p1 = [x0, y0, z1];
              p2 = [x0, y1, z1];
              p3 = [x0, y1, z0];
            } else if (f.faceIdx === 3) {
              // +X Right
              p0 = [x1, y0, z1];
              p1 = [x1, y0, z0];
              p2 = [x1, y1, z0];
              p3 = [x1, y1, z1];
            } else if (f.faceIdx === 4) {
              // +Z Front
              p0 = [x0, y0, z1];
              p1 = [x1, y0, z1];
              p2 = [x1, y1, z1];
              p3 = [x0, y1, z1];
            } else {
              // -Z Back
              p0 = [x1, y0, z0];
              p1 = [x0, y0, z0];
              p2 = [x0, y1, z0];
              p3 = [x1, y1, z0];
            }

            if (isWater) {
              // Triangle 1: p0 -> p1 -> p2
              wPositions.push(...p0, ...p1, ...p2);
              wNormals.push(f.nx, f.ny, f.nz, f.nx, f.ny, f.nz, f.nx, f.ny, f.nz);
              wUvs.push(u0, v0, u1, v0, u1, v1);

              // Triangle 2: p0 -> p2 -> p3
              wPositions.push(...p0, ...p2, ...p3);
              wNormals.push(f.nx, f.ny, f.nz, f.nx, f.ny, f.nz, f.nx, f.ny, f.nz);
              wUvs.push(u0, v0, u1, v1, u0, v1);
            } else {
              // Triangle 1: p0 -> p1 -> p2
              positions.push(...p0, ...p1, ...p2);
              normals.push(f.nx, f.ny, f.nz, f.nx, f.ny, f.nz, f.nx, f.ny, f.nz);
              uvs.push(u0, v0, u1, v0, u1, v1);
              colors.push(ao0, ao0, ao0, ao1, ao1, ao1, ao2, ao2, ao2);

              // Triangle 2: p0 -> p2 -> p3
              positions.push(...p0, ...p2, ...p3);
              normals.push(f.nx, f.ny, f.nz, f.nx, f.ny, f.nz, f.nx, f.ny, f.nz);
              uvs.push(u0, v0, u1, v1, u0, v1);
              colors.push(ao0, ao0, ao0, ao2, ao2, ao2, ao3, ao3, ao3);
            }
          }
        }
      }
    }

    // Clean up old meshes
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }
    if (chunk.waterMesh) {
      this.scene.remove(chunk.waterMesh);
      chunk.waterMesh.geometry.dispose();
      chunk.waterMesh = null;
    }

    // Create opaque chunk mesh
    if (positions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeBoundingSphere();

      const mesh = new THREE.Mesh(geo, this.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      this.scene.add(mesh);
      chunk.mesh = mesh;
    }

    // Create water chunk mesh
    if (wPositions.length > 0) {
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPositions, 3));
      wGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wNormals, 3));
      wGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wUvs, 2));
      wGeo.computeBoundingSphere();

      const wMesh = new THREE.Mesh(wGeo, this.waterMaterial);
      wMesh.receiveShadow = true;
      wMesh.frustumCulled = true;
      this.scene.add(wMesh);
      chunk.waterMesh = wMesh;
    }

    chunk.isDirty = false;
  }

  // Update chunks around player position smoothly
  update(playerX: number, playerZ: number): void {
    const centerCx = Math.floor(playerX / CHUNK_SIZE_X);
    const centerCz = Math.floor(playerZ / CHUNK_SIZE_Z);

    const newlyCreated: Chunk[] = [];

    // Phase 1: Ensure all chunks in radius exist (pure array data, no meshing)
    for (let dx = -this.renderRadius; dx <= this.renderRadius; dx++) {
      for (let dz = -this.renderRadius; dz <= this.renderRadius; dz++) {
        const cx = centerCx + dx;
        const cz = centerCz + dz;
        const key = this.getChunkKey(cx, cz);
        let chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = this.getChunk(cx, cz, false);
          newlyCreated.push(chunk);
        } else if (!chunk.mesh) {
          newlyCreated.push(chunk);
        }
      }
    }

    // Phase 2: Build meshes for any unmeshed chunks (up to 2 per frame for 60fps smoothness)
    for (let i = 0; i < Math.min(2, newlyCreated.length); i++) {
      this.buildChunkMesh(newlyCreated[i]);
    }
  }

  // Get spawn position at origin (x=8, z=8) on the surface
  getSpawnPosition(): { x: number; y: number; z: number } {
    const sx = 8;
    const sz = 8;
    // Ensure chunk is generated
    this.getChunk(0, 0);

    let maxY = 15;
    for (let y = CHUNK_SIZE_Y - 2; y >= 1; y--) {
      const b = this.getBlock(sx, y, sz);
      if (b !== BlockType.AIR && b !== BlockType.WATER && b !== BlockType.LEAVES) {
        maxY = y + 1;
        break;
      }
    }

    return { x: sx + 0.5, y: maxY + 0.1, z: sz + 0.5 };
  }
}
