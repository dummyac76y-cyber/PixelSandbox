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

  // Rotation in radians
  yaw = 0;
  pitch = 0;
  sensitivity = 0.0022;

  // Pointer lock state
  isLocked = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Key states
  private keys: Record<string, boolean> = {};

  // Action pulses
  didMineOnce = false;
  didPlaceOnce = false;
  didPickBlock = false;
  isMiningHeld = false;

  // Hotbar change callback
  onSlotChange?: (slot: number) => void;
  onToggleInventory?: () => void;
  onToggleSettings?: () => void;
  onToggleFly?: () => void;
  onToggleCameraMode?: () => void;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.bindEvents();
  }

  private bindEvents(): void {
    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    // Canvas click to request pointer lock (unless clicking UI)
    this.domElement.addEventListener('click', (e) => {
      if (!this.isLocked && e.target === this.domElement) {
        try {
          this.domElement.requestPointerLock();
        } catch {
          // Ignore
        }
      }
    });

    // Mouse move
    window.addEventListener('mousemove', (e) => {
      if (this.isLocked) {
        this.yaw -= e.movementX * this.sensitivity;
        this.pitch -= e.movementY * this.sensitivity;
        this.clampPitch();
      } else if (this.isMouseDown) {
        // Drag fallback
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.yaw -= dx * this.sensitivity;
        this.pitch -= dy * this.sensitivity;
        this.clampPitch();
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    // Mouse down
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left click: Mine
        this.isMiningHeld = true;
        this.didMineOnce = true;
      } else if (e.button === 2) {
        // Right click: Place block
        this.didPlaceOnce = true;
      } else if (e.button === 1) {
        // Middle click: Pick block
        this.didPickBlock = true;
      }

      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    // Prevent context menu on right click
    this.domElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Mouse up
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMiningHeld = false;
      }
      this.isMouseDown = false;
    });

    // Mouse wheel for hotbar selection (debounced to prevent trackpad/inertial wheel skipping)
    let lastWheelTime = 0;
    window.addEventListener(
      'wheel',
      (e) => {
        const now = performance.now();
        if (now - lastWheelTime < 65) return;
        if (this.onSlotChange) {
          const delta = Math.sign(e.deltaY);
          if (delta > 0) {
            lastWheelTime = now;
            this.onSlotChange(1); // next slot
          } else if (delta < 0) {
            lastWheelTime = now;
            this.onSlotChange(-1); // prev slot
          }
        }
      },
      { passive: true }
    );

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Number keys 1-9
      if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9 && this.onSlotChange) {
          this.onSlotChange(digit - 1); // 0-based
        }
      }

      // Hotkeys
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
      if (e.code === 'KeyR') {
        this.didPickBlock = true;
      }
      if (e.code === 'KeyQ') {
        this.didMineOnce = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Window blur: reset keys
    window.addEventListener('blur', () => {
      this.keys = {};
      this.isMiningHeld = false;
      this.isMouseDown = false;
    });
  }

  private clampPitch(): void {
    const maxPitch = (85 * Math.PI) / 180;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  // Get current movement inputs
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

    // Reset pulses
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

  // Apply camera rotation to camera
  applyToCamera(camera: THREE.Camera): void {
    camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  // Get forward look vector
  getLookDirection(): { x: number; y: number; z: number } {
    const cosPitch = Math.cos(this.pitch);
    const dirX = -Math.sin(this.yaw) * cosPitch;
    const dirY = Math.sin(this.pitch);
    const dirZ = -Math.cos(this.yaw) * cosPitch;
    return { x: dirX, y: dirY, z: dirZ };
  }
}
