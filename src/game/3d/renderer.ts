// ============================================================
// RENDERER 3D - Three.js scene, lighting, sky, clouds, in-hand tool
// ============================================================
import * as THREE from 'three';
import { BlockType, BLOCK_DEFS, createVoxelTextureAtlas } from './blocks';
import { World3D } from './world3d';
import { ParticleSystem3D } from './particles';
import { ITEM_DEFS, ItemDef } from './resources';
import { createHeldItemMesh } from './resourceRegistry';

export class GameRenderer3D {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  // World & Materials
  world: World3D;
  atlas: { texture: THREE.CanvasTexture; material: THREE.MeshStandardMaterial; waterMaterial: THREE.MeshStandardMaterial };
  particles: ParticleSystem3D;

  // Lighting & Atmosphere
  ambientLight: THREE.AmbientLight;
  sunLight: THREE.DirectionalLight;
  moonLight: THREE.DirectionalLight;
  fog: THREE.FogExp2;
  cloudGroup: THREE.Group;

  // Day/Night Cycle (locked to sunny midday for now)
  timeOfDay = 0.35; // Bright sunny midday
  dayDuration = 360;
  isDayCycleRunning = false;

  // Torch Dynamic Lighting
  torchLights: Map<string, THREE.PointLight> = new Map();
  heldTorchLight: THREE.PointLight;

  // Selection outline
  highlightBox: THREE.LineSegments;
  hasTarget = false;

  // In-hand item
  handGroup: THREE.Group;
  handMesh: THREE.Object3D | null = null;
  swingProgress = 0;
  isSwinging = false;
  bobTime = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // Canvas & WebGLRenderer
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full block select-none';
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 160);

    // Fog for depth
    this.fog = new THREE.FogExp2(0x87ceeb, 0.016);
    this.scene.fog = this.fog;

    // Texture atlas & Materials
    this.atlas = createVoxelTextureAtlas();

    // World
    this.world = new World3D(this.scene, this.atlas.material, this.atlas.waterMaterial);

    // Particles
    this.particles = new ParticleSystem3D(this.scene);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 30;
    this.sunLight.shadow.camera.bottom = -30;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x7986cb, 0.2);
    this.scene.add(this.moonLight);

    // 3D Voxel Clouds
    this.cloudGroup = this.createClouds();
    this.scene.add(this.cloudGroup);

    // Block highlight wireframe box
    const boxGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(boxGeo);
    this.highlightBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.6 })
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    // In-hand item container attached to camera
    this.handGroup = new THREE.Group();
    this.handGroup.position.set(0.32, -0.32, -0.55);
    this.camera.add(this.handGroup);
    this.scene.add(this.camera);

    // Handheld torch light
    this.heldTorchLight = new THREE.PointLight(0xffa726, 0, 16, 1.4);
    this.scene.add(this.heldTorchLight);

    this.updateAtmosphere();
  }

  setHeldTorch(active: boolean, x: number, y: number, z: number): void {
    if (active) {
      this.heldTorchLight.intensity = 2.8;
      this.heldTorchLight.position.set(x, y + 1.2, z);
    } else {
      this.heldTorchLight.intensity = 0;
    }
  }

  addTorchLight(x: number, y: number, z: number): void {
    const key = `${x},${y},${z}`;
    if (this.torchLights.has(key)) return;

    const light = new THREE.PointLight(0xffaa44, 2.6, 12, 1.4);
    light.position.set(x + 0.5, y + 0.65, z + 0.5);
    this.scene.add(light);
    this.torchLights.set(key, light);
  }

  removeTorchLight(x: number, y: number, z: number): void {
    const key = `${x},${y},${z}`;
    const light = this.torchLights.get(key);
    if (light) {
      this.scene.remove(light);
      light.dispose();
      this.torchLights.delete(key);
    }
  }

  // Create procedural drifting 3D voxel clouds
  private createClouds(): THREE.Group {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const cloudGeo = new THREE.BoxGeometry(1, 1, 1);

    // Procedural cloud patches
    const count = 35;
    for (let i = 0; i < count; i++) {
      const cx = (Math.random() - 0.5) * 160;
      const cz = (Math.random() - 0.5) * 160;
      const w = 4 + Math.floor(Math.random() * 8);
      const d = 4 + Math.floor(Math.random() * 8);

      const patch = new THREE.Mesh(cloudGeo, cloudMat);
      patch.position.set(cx, 38, cz);
      patch.scale.set(w, 1.5, d);
      group.add(patch);
    }

    return group;
  }

  // Update sun, moon, sky, and fog based on day/night cycle
  updateAtmosphere(dt = 0): void {
    if (this.isDayCycleRunning && dt > 0) {
      this.timeOfDay = (this.timeOfDay + dt / this.dayDuration) % 1.0;
    }

    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunDist = 50;

    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.sin(angle) * sunDist;
    const sunZ = Math.sin(angle * 0.5) * 20;

    // Follow camera horizontal position
    const camPos = this.camera.position;
    this.sunLight.position.set(camPos.x + sunX, Math.max(camPos.y + sunY, camPos.y + 2), camPos.z + sunZ);
    this.sunLight.target.position.set(camPos.x, camPos.y, camPos.z);
    this.sunLight.target.updateMatrixWorld();

    this.moonLight.position.set(camPos.x - sunX, camPos.y - sunY, camPos.z - sunZ);
    this.moonLight.target.position.set(camPos.x, camPos.y, camPos.z);

    // Sun altitude: -1 (midnight) to +1 (noon)
    const sunAlt = Math.sin(angle);

    let skyColor: THREE.Color;
    let fogColor: THREE.Color;

    if (sunAlt > 0.2) {
      // Day
      const dayFactor = Math.min(1.0, (sunAlt - 0.2) / 0.5);
      skyColor = new THREE.Color(0x7ec0ee).lerp(new THREE.Color(0x9bd7ff), dayFactor);
      fogColor = skyColor.clone();
      this.sunLight.intensity = 1.35 * dayFactor;
      this.ambientLight.intensity = 0.5 + 0.2 * dayFactor;
      this.ambientLight.color.setHex(0xffffff);
      this.sunLight.color.setHex(0xfffaed);
    } else if (sunAlt > -0.1) {
      // Sunset / Sunrise
      const sunsetFactor = (sunAlt + 0.1) / 0.3;
      skyColor = new THREE.Color(0x192138).lerp(new THREE.Color(0xff8a50), sunsetFactor);
      fogColor = skyColor.clone();
      this.sunLight.intensity = 0.8 * sunsetFactor;
      this.ambientLight.intensity = 0.35;
      this.ambientLight.color.setHex(0xffd5b8);
      this.sunLight.color.setHex(0xff9e64);
    } else {
      // Night
      skyColor = new THREE.Color(0x0a0f1d);
      fogColor = new THREE.Color(0x0c1326);
      this.sunLight.intensity = 0.0;
      this.ambientLight.intensity = 0.22;
      this.ambientLight.color.setHex(0x5c6bc0);
    }

    this.scene.background = skyColor;
    this.fog.color = fogColor;

    // Slowly drift clouds
    if (this.cloudGroup && dt > 0) {
      this.cloudGroup.position.x = (this.cloudGroup.position.x + dt * 0.8) % 160;
    }
  }

  // Update target block highlight box
  setTargetBlock(target: { x: number; y: number; z: number } | null): void {
    if (target) {
      this.highlightBox.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
      this.highlightBox.visible = true;
      this.hasTarget = true;
    } else {
      this.highlightBox.visible = false;
      this.hasTarget = false;
    }
  }

  // Update in-hand item model
  updateHandItem(itemDef: ItemDef | null): void {
    // Clear existing mesh safely
    if (this.handMesh) {
      this.handGroup.remove(this.handMesh);
      this.handMesh.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
      this.handMesh = null;
    }

    if (!itemDef) {
      // Default player hand (fist)
      const handGeo = new THREE.BoxGeometry(0.14, 0.28, 0.14);
      const handMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.9 });
      this.handMesh = new THREE.Mesh(handGeo, handMat);
      this.handMesh.position.set(0, 0, 0);
      this.handMesh.rotation.set(-0.3, 0.2, -0.1);
      this.handGroup.add(this.handMesh);
      return;
    }

    // Render held item using actual resource pack texture / 3D block model
    this.handMesh = createHeldItemMesh(itemDef.id, 0.28);
    this.handGroup.add(this.handMesh);
  }

  // Trigger mining/attack swing animation
  triggerSwing(): void {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  // Update in-hand animations (bobbing and swinging)
  updateHandAnimation(dt: number, isMoving: boolean): void {
    // Walking bobbing
    if (isMoving) {
      this.bobTime += dt * 9.0;
    } else {
      this.bobTime += dt * 1.5;
    }

    const bobX = Math.sin(this.bobTime) * 0.015;
    const bobY = Math.abs(Math.cos(this.bobTime)) * 0.025;

    // Swing animation
    let swingOffset = 0;
    let swingRot = 0;
    if (this.isSwinging) {
      this.swingProgress += dt * 6.5;
      if (this.swingProgress >= 1.0) {
        this.isSwinging = false;
        this.swingProgress = 0;
      } else {
        // Swing arc
        const arc = Math.sin(this.swingProgress * Math.PI);
        swingOffset = arc * 0.12;
        swingRot = arc * 0.9;
      }
    }

    this.handGroup.position.set(0.32 + bobX, -0.32 - bobY - swingOffset, -0.55 + swingOffset * 0.5);
    this.handGroup.rotation.set(-swingRot * 0.8, swingRot * 0.3, -swingRot * 0.5);
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.handMesh) {
      this.handMesh.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
      this.handMesh = null;
    }
    this.renderer.dispose();
    this.canvas.remove();
    this.particles.dispose();
  }
}
