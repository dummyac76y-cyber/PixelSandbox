// ============================================================
// CONTROLS 3D - First-person camera look, keyboard, mouse, touch
// ============================================================
import * as THREE from 'three';

export interface PlayerControlsInput {
  forward: number;
  strafe: number;
  jump: boolean;
  sprint: boolean;
  flyUp: boolean;
  flyDown: boolean;
  isMining: boolean;
  didMineOnce: boolean;
  didPlaceOnce: boolean;
  didPickBlock: boolean;
}

export class Controls3D {
  domElement: HTMLElement;
  yaw = 0;
  pitch = 0;
  sensitivity = 0.0022;
  isLocked = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private keys: Record<string, boolean> = {};

  didMineOnce = false;
  didPlaceOnce = false;
  didPickBlock = false;
  isMiningHeld = false;

  onSlotChange?: (slot: number) => void;
  onSlotScroll?: (delta: number) => void;
  onToggleInventory?: () => void;
  onToggleSettings?: () => void;
  onToggleFly?: () => void;
  onToggleCameraMode?: () => void;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.bindEvents();
  }

  private bindEvents(): void {
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    this.domElement.addEventListener('click', (e) => {
      if (!this.isLocked && e.target === this.domElement) {
        try { this.domElement.requestPointerLock(); } catch { /* Ignore */ }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isLocked) {
        this.yaw -= e.movementX * this.sensitivity;
        this.pitch -= e.movementY * this.sensitivity;
        this.clampPitch();
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.yaw -= dx * this.sensitivity;
        this.pitch -= dy * this.sensitivity;
        this.clampPitch();
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMiningHeld = true;
        this.didMineOnce = true;
      } else if (e.button === 2) {
        this.didPlaceOnce = true;
      } else if (e.button === 1) {
        this.didPickBlock = true;
      }
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMiningHeld = false;
      this.isMouseDown = false;
    });

    // Hotbar wheel: accumulate wheel motion so high-resolution mouse wheels
    // and trackpads scroll smoothly, one hotbar slot per threshold.
    let wheelAccumulator = 0;
    window.addEventListener('wheel', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('input, textarea, select, button, [contenteditable="true"]') || target.closest('[data-no-hotbar-wheel]'))) {
        return;
      }

      const overGame = e.target === this.domElement || this.domElement.contains(e.target as Node);
      if (!this.isLocked && !overGame) return;

      e.preventDefault();

      const rawDelta = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? e.deltaY * window.innerHeight
        : e.deltaY;
      if (!rawDelta) return;

      wheelAccumulator += rawDelta;
      const threshold = 30;

      while (Math.abs(wheelAccumulator) >= threshold) {
        const direction = wheelAccumulator > 0 ? 1 : -1;
        wheelAccumulator -= direction * threshold;

        if (this.onSlotScroll) {
          this.onSlotScroll(direction > 0 ? 1 : -1);
        } else if (this.onSlotChange) {
          this.onSlotChange(direction > 0 ? 10 : -1);
        }
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9 && this.onSlotChange) {
          this.onSlotChange(digit - 1);
        }
      }

      if (e.code === 'KeyE' || e.code === 'KeyI') {
        if (this.onToggleInventory) this.onToggleInventory();
      }
      if (e.code === 'Escape') {
        if (this.onToggleSettings) this.onToggleSettings();
      }
      if (e.code === 'KeyF') {
        if (this.onToggleFly) this.onToggleFly();
      }
      if (e.code === 'KeyV') {
        if (this.onToggleCameraMode) this.onToggleCameraMode();
      }
      if (e.code === 'KeyR') this.didPickBlock = true;
      if (e.code === 'KeyQ') this.didMineOnce = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.isMiningHeld = false;
      this.isMouseDown = false;
      wheelAccumulator = 0;
    });
  }

  private clampPitch(): void {
    const maxPitch = (85 * Math.PI) / 180;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  getInput(): PlayerControlsInput {
    let forward = 0;
    let strafe = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) strafe -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) strafe += 1;

    const jump = !!this.keys['Space'];
    const sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const flyUp = jump;
    const flyDown = sprint;
    const didMine = this.didMineOnce;
    const didPlace = this.didPlaceOnce;
    const didPick = this.didPickBlock;
    this.didMineOnce = false;
    this.didPlaceOnce = false;
    this.didPickBlock = false;

    return {
      forward,
      strafe,
      jump,
      sprint,
      flyUp,
      flyDown,
      isMining: this.isMiningHeld,
      didMineOnce: didMine,
      didPlaceOnce: didPlace,
      didPickBlock: didPick,
    };
  }

  applyToCamera(camera: THREE.Camera): void {
    camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  getLookDirection(): { x: number; y: number; z: number } {
    const cosPitch = Math.cos(this.pitch);
    const dirX = -Math.sin(this.yaw) * cosPitch;
    const dirY = Math.sin(this.pitch);
    const dirZ = -Math.cos(this.yaw) * cosPitch;
    return { x: dirX, y: dirY, z: dirZ };
  }
}
