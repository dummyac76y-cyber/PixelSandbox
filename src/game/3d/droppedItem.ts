// ============================================================
// DROPPED ITEMS - 3D Floating & Spinning Voxel Item Entities
// ============================================================
import * as THREE from 'three';
import { World3D } from './world3d';
import { BlockType, BLOCK_DEFS } from './blocks';
import { ITEM_DEFS } from './resources';

export interface DroppedItem {
  id: number;
  itemId: string;
  count: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isGrounded: boolean;
  baseY: number;
  mesh: THREE.Object3D;
  lifeTime: number;
  bobTime: number;
}

export class DroppedItemManager {
  scene: THREE.Scene;
  world: World3D;
  items: DroppedItem[] = [];
  nextId = 1;

  constructor(scene: THREE.Scene, world: World3D) {
    this.scene = scene;
    this.world = world;
  }

  spawnDrop(x: number, y: number, z: number, itemId: string, count = 1): void {
    const def = ITEM_DEFS[itemId];
    if (!def) return;

    let mesh: THREE.Object3D;

    if (itemId === 'torch') {
      // Slender torch miniature
      const group = new THREE.Group();
      const stick = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.24, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x5c3d23, roughness: 0.8 })
      );
      group.add(stick);
      const flame = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      flame.position.y = 0.12;
      group.add(flame);
      mesh = group;
    } else if (def.toolType) {
      // Mini tool
      const group = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.28, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x5c3d23 })
      );
      group.add(handle);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.06),
        new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.4 })
      );
      head.position.y = 0.12;
      group.add(head);
      group.rotation.z = Math.PI / 4;
      mesh = group;
    } else {
      // Mini voxel block
      const geo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.8,
        metalness: 0.1,
      });
      mesh = new THREE.Mesh(geo, mat);
    }

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const drop: DroppedItem = {
      id: this.nextId++,
      itemId,
      count,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 1.6,
      vy: 2.2 + Math.random() * 0.6,
      vz: (Math.random() - 0.5) * 1.6,
      isGrounded: false,
      baseY: y,
      mesh,
      lifeTime: 0,
      bobTime: Math.random() * Math.PI * 2,
    };

    this.items.push(drop);

    // Limit maximum drops
    if (this.items.length > 50) {
      const oldest = this.items.shift();
      if (oldest) {
        this.destroyItemMesh(oldest);
      }
    }
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    playerZ: number,
    onCollect: (itemId: string, count: number) => void
  ): void {
    const remaining: DroppedItem[] = [];

    for (const item of this.items) {
      item.lifeTime += dt;
      item.bobTime += dt * 3.5;

      // Distance to player
      const dx = playerX - item.x;
      const dy = playerY + 0.8 - item.y;
      const dz = playerZ - item.z;
      const dist = Math.hypot(dx, dy, dz);

      // Collect item if close
      if (dist < 0.85 && item.lifeTime > 0.25) {
        onCollect(item.itemId, item.count);
        this.destroyItemMesh(item);
        continue;
      }

      // Magnet pull towards player
      if (dist < 2.5 && item.lifeTime > 0.4) {
        const pullSpeed = 8.0;
        item.vx += (dx / dist) * pullSpeed * dt;
        item.vy += (dy / dist) * pullSpeed * dt;
        item.vz += (dz / dist) * pullSpeed * dt;
        item.isGrounded = false;
      }

      // Physics
      if (!item.isGrounded) {
        item.vy -= 12.0 * dt; // gravity
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.z += item.vz * dt;

        // Friction
        item.vx *= Math.pow(0.5, dt * 4);
        item.vz *= Math.pow(0.5, dt * 4);

        // Ground check
        const blockX = Math.floor(item.x);
        const blockY = Math.floor(item.y);
        const blockZ = Math.floor(item.z);
        const b = this.world.getBlock(blockX, blockY, blockZ);

        if (b !== BlockType.AIR && b !== BlockType.WATER && b !== BlockType.TORCH) {
          item.isGrounded = true;
          item.baseY = blockY + 1.0;
          item.y = item.baseY;
          item.vy = 0;
          item.vx = 0;
          item.vz = 0;
        }
      }

      // Visual spin and floating bob
      if (item.isGrounded) {
        item.y = item.baseY + 0.12 + Math.sin(item.bobTime) * 0.05;
      }

      item.mesh.position.set(item.x, item.y, item.z);
      item.mesh.rotation.y += dt * 2.5;

      remaining.push(item);
    }

    this.items = remaining;
  }

  private destroyItemMesh(item: DroppedItem): void {
    this.scene.remove(item.mesh);
    item.mesh.traverse((child) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    });
  }

  dispose(): void {
    for (const item of this.items) {
      this.destroyItemMesh(item);
    }
    this.items = [];
  }
}
