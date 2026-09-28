// ============================================================
// GAME 3D - Master Engine Coordinator
// ============================================================
import { GameRenderer3D } from './renderer';
import { PhysicsController } from './physics';
import { Controls3D, PlayerControlsInput } from './controls';
import { PlayerInventory, ITEM_DEFS, blockTypeToItemId } from './resources';
import { AudioManager } from '../audio';
import { raycastVoxels, VoxelRaycastHit } from './raycast';
import { BlockType, BLOCK_DEFS } from './blocks';
import { PlayerModel3D } from './playerModel';
import { DroppedItemManager } from './droppedItem';

export type CameraViewMode = 'first' | 'third' | 'isometric';

export interface Game3DState {
  fps: number;
  playerPos: { x: number; y: number; z: number };
  isGrounded: boolean;
  isFlying: boolean;
  timeOfDay: number;
  targetedBlock: { x: number; y: number; z: number; type: BlockType; name: string } | null;
  miningProgress: number; // 0 to 1
  selectedSlot: number;
  isInventoryOpen: boolean;
  isSettingsOpen: boolean;
  notification: string | null;
  cameraMode: CameraViewMode;
}

export class Game3D {
  container: HTMLElement;
  renderer: GameRenderer3D;
  physics: PhysicsController;
  controls: Controls3D;
  inventory: PlayerInventory;
  audio: AudioManager;
  droppedItemManager: DroppedItemManager;

  // State
  isRunning = false;
  lastTime = 0;
  stepTimer = 0;

  // Mining state
  miningTarget: { x: number; y: number; z: number } | null = null;
  miningProgress = 0; // 0 to 1
  currentHit: VoxelRaycastHit | null = null;

  // UI state listener
  onStateUpdate?: (state: Game3DState) => void;
  isInventoryOpen = false;
  isSettingsOpen = false;
  notification: string | null = null;
  notificationTimer = 0;
  uiTimer = 0;

  // Performance metrics
  frameCount = 0;
  fps = 60;
  fpsTimer = 0;

  cameraMode: CameraViewMode = 'third';
  playerModel: PlayerModel3D;

  constructor(container: HTMLElement) {
    this.container = container;

    // Subsystems
    this.renderer = new GameRenderer3D(container);
    this.audio = new AudioManager();
    this.inventory = new PlayerInventory();
    this.playerModel = new PlayerModel3D(this.renderer.scene);
    this.droppedItemManager = new DroppedItemManager(this.renderer.scene, this.renderer.world);

    // Initialize torch lights from saved world
    for (const [key, type] of this.renderer.world.modifiedBlocks.entries()) {
      if (type === BlockType.TORCH) {
        const [x, y, z] = key.split(',').map(Number);
        this.renderer.addTorchLight(x, y, z);
      }
    }

    const spawn = this.renderer.world.getSpawnPosition();
    this.physics = new PhysicsController(this.renderer.world, spawn);
    this.controls = new Controls3D(this.renderer.canvas);

    this.bindControls();
    this.updateHandItem();
  }

  private bindControls(): void {
    this.controls.onSlotChange = (slotDeltaOrIndex: number) => {
      if (slotDeltaOrIndex >= 0 && slotDeltaOrIndex <= 8) {
        this.inventory.selectedSlot = slotDeltaOrIndex;
      } else {
        // Delta (+1 or -1)
        this.inventory.selectedSlot = (this.inventory.selectedSlot + slotDeltaOrIndex + 9) % 9;
      }
      this.inventory.save();
      this.updateHandItem();
      this.audio.playUIClick();
    };

    this.controls.onToggleInventory = () => {
      this.isInventoryOpen = !this.isInventoryOpen;
      if (this.isInventoryOpen && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    this.controls.onToggleSettings = () => {
      this.isSettingsOpen = !this.isSettingsOpen;
      if (this.isSettingsOpen && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    this.controls.onToggleFly = () => {
      this.physics.state.isFlying = !this.physics.state.isFlying;
      this.showNotification(this.physics.state.isFlying ? 'Creative Flight: ON (Space / Shift)' : 'Creative Flight: OFF');
      this.audio.playUIClick();
    };

    this.controls.onToggleCameraMode = () => {
      this.cycleCameraMode();
    };
  }

  cycleCameraMode(): void {
    if (this.cameraMode === 'third') {
      this.cameraMode = 'first';
      this.showNotification('Camera: First-Person (V)');
    } else if (this.cameraMode === 'first') {
      this.cameraMode = 'isometric';
      this.showNotification('Camera: 2.5D Isometric (V)');
    } else {
      this.cameraMode = 'third';
      this.showNotification('Camera: Third-Person (V)');
    }
    this.audio.playUIClick();
  }

  showNotification(msg: string): void {
    this.notification = msg;
    this.notificationTimer = 2.5; // 2.5 seconds
  }

  updateHandItem(): void {
    const activeSlot = this.inventory.getActiveSheetItem();
    const itemDef = activeSlot ? ITEM_DEFS[activeSlot.itemId] : null;
    this.renderer.updateHandItem(itemDef || null);
    this.playerModel.updateHeldItem(activeSlot ? activeSlot.itemId : null);
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    this.isRunning = false;
  }

  private loop(time: number): void {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // FPS calculation
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round((this.frameCount / this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    const input = this.controls.getInput();

    // Update player physics
    this.physics.update(dt, input, this.controls.yaw);

    const eye = this.physics.getEyePosition();
    const yaw = this.controls.yaw;
    const pitch = this.controls.pitch;

    // Position and aim camera based on active camera mode
    if (this.cameraMode === 'first') {
      this.renderer.camera.position.set(eye.x, eye.y, eye.z);
      this.controls.applyToCamera(this.renderer.camera);
      this.playerModel.setVisible(false);
      this.renderer.handGroup.visible = true;
    } else if (this.cameraMode === 'third') {
      // Third-person chase cam
      const dist = 3.6;
      const camX = this.physics.state.x + Math.sin(yaw) * dist;
      const camY = this.physics.state.y + 1.8 + Math.sin(pitch) * 1.5;
      const camZ = this.physics.state.z + Math.cos(yaw) * dist;
      this.renderer.camera.position.set(camX, camY, camZ);
      this.renderer.camera.lookAt(this.physics.state.x, this.physics.state.y + 1.2, this.physics.state.z);
      this.playerModel.setVisible(true);
      this.renderer.handGroup.visible = false;
    } else {
      // 2.5D Isometric view
      const camX = this.physics.state.x + 7.5;
      const camY = this.physics.state.y + 10.5;
      const camZ = this.physics.state.z + 7.5;
      this.renderer.camera.position.set(camX, camY, camZ);
      this.renderer.camera.lookAt(this.physics.state.x, this.physics.state.y + 0.8, this.physics.state.z);
      this.playerModel.setVisible(true);
      this.renderer.handGroup.visible = false;
    }

    const isMoving = Math.hypot(input.forward, input.strafe) > 0.1;

    // Update 3D player avatar animations
    this.playerModel.update(
      this.physics.state.x,
      this.physics.state.y,
      this.physics.state.z,
      this.controls.yaw,
      this.controls.pitch,
      isMoving,
      this.renderer.isSwinging,
      this.renderer.swingProgress,
      dt
    );

    // Footstep audio
    if (isMoving && this.physics.state.isGrounded && !this.physics.state.isFlying) {
      this.stepTimer += dt;
      const stepFreq = input.sprint ? 0.28 : 0.38;
      if (this.stepTimer >= stepFreq) {
        this.stepTimer = 0;
        this.audio.playStep();
      }
    } else {
      this.stepTimer = 0;
    }

    // Raycast targeted voxel
    const lookDir = this.controls.getLookDirection();
    this.currentHit = raycastVoxels(
      this.renderer.world,
      eye.x,
      eye.y,
      eye.z,
      lookDir.x,
      lookDir.y,
      lookDir.z,
      6.0
    );

    // Update wireframe highlight box in renderer
    if (this.currentHit) {
      this.renderer.setTargetBlock({ x: this.currentHit.x, y: this.currentHit.y, z: this.currentHit.z });
    } else {
      this.renderer.setTargetBlock(null);
    }

    // Mining / Breaking logic
    this.handleMining(dt, input);

    // Placing block logic
    if (input.didPlaceOnce) {
      this.handlePlacing();
    }

    // Middle click: Pick block
    if (input.didPickBlock && this.currentHit) {
      this.handlePickBlock(this.currentHit.type);
    }

    // Update in-hand weapon animation
    this.renderer.updateHandAnimation(dt, isMoving);

    // Update sky, atmosphere & drifting clouds
    this.renderer.updateAtmosphere(dt);

    // Update debris particles
    this.renderer.particles.update(dt);

    // Update 3D floating & spinning item drops (with magnet collection)
    this.droppedItemManager.update(
      dt,
      this.physics.state.x,
      this.physics.state.y,
      this.physics.state.z,
      (itemId, count) => {
        const itemDef = ITEM_DEFS[itemId];
        const added = this.inventory.addItem(itemId, count);
        if (added) {
          this.audio.playItemPickup();
          this.showNotification(`+${count} ${itemDef ? itemDef.name : 'Item'}`);
          this.updateHandItem();
        }
      }
    );

    // Update handheld torch dynamic lighting
    const activeSlot = this.inventory.getActiveSheetItem();
    const isHoldingTorch = activeSlot?.itemId === 'torch';
    this.renderer.setHeldTorch(isHoldingTorch, this.physics.state.x, this.physics.state.y, this.physics.state.z);

    // Update active chunks around player
    this.renderer.world.update(this.physics.state.x, this.physics.state.z);

    // Notification timer
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) {
        this.notification = null;
      }
    }

    // Emit state for React UI overlay (throttled to 100ms or when mining/notification updates)
    this.uiTimer = (this.uiTimer || 0) + dt;
    if (this.onStateUpdate && (this.uiTimer >= 0.1 || this.miningProgress > 0 || this.notificationTimer > 0)) {
      this.uiTimer = 0;
      const targetDef = this.currentHit ? BLOCK_DEFS[this.currentHit.type] : null;
      this.onStateUpdate({
        fps: this.fps,
        playerPos: {
          x: Math.round(this.physics.state.x),
          y: Math.round(this.physics.state.y),
          z: Math.round(this.physics.state.z),
        },
        isGrounded: this.physics.state.isGrounded,
        isFlying: this.physics.state.isFlying,
        timeOfDay: this.renderer.timeOfDay,
        targetedBlock: this.currentHit
          ? {
              x: this.currentHit.x,
              y: this.currentHit.y,
              z: this.currentHit.z,
              type: this.currentHit.type,
              name: targetDef ? targetDef.name : 'Block',
            }
          : null,
        miningProgress: this.miningProgress,
        selectedSlot: this.inventory.selectedSlot,
        isInventoryOpen: this.isInventoryOpen,
        isSettingsOpen: this.isSettingsOpen,
        notification: this.notification,
        cameraMode: this.cameraMode,
      });
    }
  }

  private handleMining(dt: number, input: PlayerControlsInput): void {
    if (!this.currentHit) {
      this.miningProgress = 0;
      this.miningTarget = null;
      return;
    }

    const hit = this.currentHit;
    const sameTarget = this.miningTarget && this.miningTarget.x === hit.x && this.miningTarget.y === hit.y && this.miningTarget.z === hit.z;

    if (input.isMining || input.didMineOnce) {
      this.renderer.triggerSwing();

      if (!sameTarget) {
        this.miningTarget = { x: hit.x, y: hit.y, z: hit.z };
        this.miningProgress = 0;
      }

      const blockDef = BLOCK_DEFS[hit.type];
      const activeSlot = this.inventory.getActiveSheetItem();
      const itemDef = activeSlot ? ITEM_DEFS[activeSlot.itemId] : null;

      // Base hardness mining rate
      const baseHardness = blockDef ? Math.max(0.1, blockDef.hardness) : 1.0;
      let power = 1.0;
      if (itemDef?.toolType === 'pickaxe') {
        power = itemDef.miningPower || 2.0;
      } else if (itemDef?.toolType === 'axe') {
        power = itemDef.miningPower || 1.8;
      }

      // In creative fly mode, instant mining
      if (this.physics.state.isFlying) {
        power = 999.0;
      }

      this.miningProgress += (dt * power) / baseHardness;

      // Crack sound periodically
      if (Math.random() < 0.25) {
        this.audio.playTone(180, 0.04, 'sawtooth', 0.15, (this.audio as any).sfxGain);
      }

      // Block broken!
      if (this.miningProgress >= 1.0) {
        this.breakBlock(hit.x, hit.y, hit.z, hit.type);
        this.miningProgress = 0;
        this.miningTarget = null;
      }
    } else {
      this.miningProgress = 0;
      this.miningTarget = null;
    }
  }

  private breakBlock(x: number, y: number, z: number, type: BlockType): void {
    const blockDef = BLOCK_DEFS[type];

    // Remove from world
    this.renderer.world.setBlock(x, y, z, BlockType.AIR);

    // If breaking a torch, remove its dynamic light
    if (type === BlockType.TORCH) {
      this.renderer.removeTorchLight(x, y, z);
    }

    // Audio & Debris particles
    this.audio.playBlockBreak();
    this.renderer.particles.spawnBlockDebris(x, y, z, blockDef ? blockDef.color : '#888888', 16);

    // Spawn 3D floating & spinning item drop in the world!
    const dropItemId = blockTypeToItemId(type);
    const dropCount = blockDef ? blockDef.dropCount : 1;
    this.droppedItemManager.spawnDrop(x + 0.5, y + 0.3, z + 0.5, dropItemId, dropCount);
  }

  private handlePlacing(): void {
    if (!this.currentHit) return;

    const activeSlot = this.inventory.getActiveSheetItem();
    if (!activeSlot) return;

    const itemDef = ITEM_DEFS[activeSlot.itemId];
    if (!itemDef || itemDef.blockType === undefined || itemDef.blockType === BlockType.AIR) {
      return;
    }

    const { x, y, z } = this.currentHit.placePos;

    // Check player AABB collision so you don't place a block inside yourself
    const px = this.physics.state.x;
    const py = this.physics.state.y;
    const pz = this.physics.state.z;
    const halfW = PhysicsController.WIDTH / 2;

    const insidePlayer =
      x + 1 > px - halfW &&
      x < px + halfW &&
      y + 1 > py &&
      y < py + PhysicsController.HEIGHT &&
      z + 1 > pz - halfW &&
      z < pz + halfW;

    if (insidePlayer && !this.physics.state.isFlying) {
      // Cannot place block inside player
      return;
    }

    // Place block in world
    const placed = this.renderer.world.setBlock(x, y, z, itemDef.blockType);
    if (placed) {
      // If placing a torch, illuminate surroundings with real point light
      if (itemDef.blockType === BlockType.TORCH) {
        this.renderer.addTorchLight(x, y, z);
      }
      this.renderer.triggerSwing();
      this.audio.playBlockPlace();
      this.inventory.consumeActiveItem();
      this.updateHandItem();
    }
  }

  private handlePickBlock(type: BlockType): void {
    const itemId = blockTypeToItemId(type);
    const itemDef = ITEM_DEFS[itemId];
    if (!itemDef) return;

    // Check if item is already in hotbar
    for (let i = 0; i < this.inventory.hotbar.length; i++) {
      const slot = this.inventory.hotbar[i];
      if (slot && slot.itemId === itemId) {
        this.inventory.selectedSlot = i;
        this.inventory.save();
        this.updateHandItem();
        this.audio.playUIClick();
        return;
      }
    }

    // If not in hotbar, put into selected slot or first empty
    this.inventory.hotbar[this.inventory.selectedSlot] = { itemId, count: 64 };
    this.inventory.save();
    this.updateHandItem();
    this.showNotification(`Selected: ${itemDef.name}`);
    this.audio.playUIClick();
  }

  private render(): void {
    this.renderer.render();
  }

  resize(): void {
    this.renderer.resize();
  }

  dispose(): void {
    this.isRunning = false;
    this.droppedItemManager.dispose();
    this.playerModel.dispose();
    this.renderer.dispose();
  }
}
