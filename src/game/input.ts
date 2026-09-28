// ============================================================
// INPUT - Keyboard, mouse, buffering, rebinding
// ============================================================

export interface KeyBindings {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  attack: string[];
  interact: string[];
  inventory: string[];
  pause: string[];
  jump: string[];
  toggleMode: string[];
  hotbarPrev: string[];
  hotbarNext: string[];
}

const DEFAULT_BINDINGS: KeyBindings = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  attack: ['Space', 'KeyJ'],
  interact: ['KeyE'],
  inventory: ['KeyI'],
  pause: ['Escape'],
  jump: ['KeyK', 'ShiftLeft', 'ShiftRight'],
  toggleMode: ['KeyQ'],
  hotbarPrev: ['KeyZ'],
  hotbarNext: ['KeyX'],
};

export class Input {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private justReleased: Set<string> = new Set();
  private mouseX = 0;
  private mouseY = 0;
  private mouseDown = false;
  private mouseJustPressed = false;
  private mouseJustReleased = false;
  private canvas: HTMLCanvasElement | null = null;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  bindings: KeyBindings;

  constructor() {
    this.bindings = { ...DEFAULT_BINDINGS };
    // Deep copy arrays
    for (const key of Object.keys(this.bindings) as (keyof KeyBindings)[]) {
      this.bindings[key] = [...DEFAULT_BINDINGS[key]];
    }
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
      // Prevent default for game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.justReleased.add(e.code);
    });

    canvas.addEventListener('mousemove', (e) => {
      this.updateMousePos(e);
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.mouseJustPressed = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
        this.mouseJustReleased = true;
      }
    });

    // Clear all input on blur to prevent stuck keys
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.justPressed.clear();
      this.justReleased.clear();
      this.mouseDown = false;
    });

    // Handle visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.keys.clear();
        this.justPressed.clear();
        this.justReleased.clear();
        this.mouseDown = false;
      }
    });
  }

  updateTransform(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  private updateMousePos(e: MouseEvent): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = Math.floor((e.clientX - rect.left - this.offsetX) / this.scale);
    this.mouseY = Math.floor((e.clientY - rect.top - this.offsetY) / this.scale);
  }

  // Called at end of each frame to clear just-pressed states
  endFrame(): void {
    this.justPressed.clear();
    this.justReleased.clear();
    this.mouseJustPressed = false;
    this.mouseJustReleased = false;
  }

  // ---- Query methods ----
  isDown(action: keyof KeyBindings): boolean {
    return this.bindings[action].some(k => this.keys.has(k));
  }

  isJustPressed(action: keyof KeyBindings): boolean {
    return this.bindings[action].some(k => this.justPressed.has(k));
  }

  isKeyJustPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  // Movement as normalized vector
  getMovement(): { x: number; y: number } {
    let x = 0, y = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    if (this.isDown('up')) y -= 1;
    if (this.isDown('down')) y += 1;
    // Normalize diagonal
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  // Mouse
  getMouseX(): number { return this.mouseX; }
  getMouseY(): number { return this.mouseY; }
  isMouseDown(): boolean { return this.mouseDown; }
  isMouseJustPressed(): boolean { return this.mouseJustPressed; }
  isMouseJustReleased(): boolean { return this.mouseJustReleased; }

  // Save/load bindings
  saveBindings(): string {
    return JSON.stringify(this.bindings);
  }

  loadBindings(json: string): void {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        for (const key of Object.keys(this.bindings) as (keyof KeyBindings)[]) {
          if (Array.isArray(parsed[key])) {
            this.bindings[key] = parsed[key];
          }
        }
      }
    } catch (e) {
      // Use defaults
    }
  }
}
