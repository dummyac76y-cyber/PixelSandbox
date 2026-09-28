// ============================================================
// PARTICLES - 3D block breaking debris & floating pickups
// ============================================================
import * as THREE from 'three';

interface VoxelParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem3D {
  scene: THREE.Scene;
  particles: VoxelParticle[] = [];
  sharedGeo: THREE.BoxGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sharedGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  // Spawn debris when a block is broken
  spawnBlockDebris(x: number, y: number, z: number, color: string, count = 16): void {
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sharedGeo, mat);
      mesh.position.set(
        x + 0.5 + (Math.random() - 0.5) * 0.7,
        y + 0.5 + (Math.random() - 0.5) * 0.7,
        z + 0.5 + (Math.random() - 0.5) * 0.7
      );

      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2.0 + Math.random() * 3.5,
        vz: Math.sin(angle) * speed,
        rotX: (Math.random() - 0.5) * 10,
        rotY: (Math.random() - 0.5) * 10,
        rotZ: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  update(dt: number): void {
    const gravity = -18.0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vy += gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      p.mesh.rotation.x += p.rotX * dt;
      p.mesh.rotation.y += p.rotY * dt;
      p.mesh.rotation.z += p.rotZ * dt;

      // Scale down near end of life
      const remainingRatio = 1.0 - p.life / p.maxLife;
      const scale = Math.max(0.01, remainingRatio);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  dispose(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
    this.sharedGeo.dispose();
  }
}
