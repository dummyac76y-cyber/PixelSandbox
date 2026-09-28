// ============================================================
// ENGINE - Infinite sandbox game loop
// ============================================================
import {
  GameState, PlayerState, Dir, ItemType,
  INTERNAL_W, INTERNAL_H, FIXED_DT, TILE_SIZE, PALETTE,
  clamp, lerp, TileType, Rect
} from './constants';
import { initSprites, SpriteSheet } from './sprites';
import { Input } from './input';
import { AudioManager } from './audio';
import { World, CHUNK_SIZE, isBreakable, tileToItem, itemToTile } from './world';
import { Player, ParticleSystem } from './entities';
import { UI } from './ui';
import { Inventory, ITEMS } from './systems';

export class Game {
  // Canvas
  mainCanvas: HTMLCanvasElement;
  mainCtx: CanvasRenderingContext2D;
  bufferCanvas: HTMLCanvasElement;
  bufferCtx: CanvasRenderingContext2D;
  scale: number = 1;
  offsetX: number = 0;
  offsetY: number = 0;

  // Systems
  input: Input;
  audio: AudioManager;
  sprites: Map<string, SpriteSheet> = new Map();
  world: World;
  ui: UI;
  inventory: Inventory;
  particles: ParticleSystem;

  // Entities
  player: Player;

  // State
  state: GameState = GameState.BOOT;
  prevState: GameState = GameState.BOOT;
  menuIndex: number = 0;
  pauseMenuIndex: number = 0;
  settingsIndex: number = 0;
  rebindingKey: string | null = null;

  // Camera
  camX: number = 0;
  camY: number = 0;
  targetCamX: number = 0;
  targetCamY: number = 0;
  shakeX: number = 0;
  shakeY: number = 0;
  shakeTimer: number = 0;

  // Timing
  lastTime: number = 0;
  accumulator: number = 0;

  // Block interaction
  breakTimer: number = 0;
  breakTarget: { tx: number; ty: number } | null = null;
  placeMode: boolean = false;
  selectedSlot: number = 0;
  hotbarItems: string[] = ['wood', 'stone', 'leaves', '', '', '', '', '', ''];
  showHelp: boolean = true;
  helpTimer: number = 300; // Show help for 5 seconds at start

  // Volumes
  volumes: number[] = [0.7, 0.4, 0.6];

  constructor(canvas: HTMLCanvasElement) {
    this.mainCanvas = canvas;
    this.mainCtx = canvas.getContext('2d')!;
    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = INTERNAL_W;
    this.bufferCanvas.height = INTERNAL_H;
    this.bufferCtx = this.bufferCanvas.getContext('2d')!;
    this.bufferCtx.imageSmoothingEnabled = false;
    this.mainCtx.imageSmoothingEnabled = false;

    this.input = new Input();
    this.audio = new AudioManager();
    this.world = new World();
    this.ui = new UI();
    this.inventory = new Inventory();
    this.particles = new ParticleSystem();

    // Temporary spawn; startNewGame() finds a guaranteed-safe spawn position
    this.player = new Player(0, 0);
  }

  async init(): Promise<void> {
    this.sprites = initSprites();
    this.input.attach(this.mainCanvas);

    const settings = JSON.parse(localStorage.getItem('shadows_settings') || '{}');
    if (settings.volumes) this.volumes = settings.volumes;
    if (settings.bindings) this.input.loadBindings(settings.bindings);
    this.audio.setMasterVolume(this.volumes[0]);
    this.audio.setMusicVolume(this.volumes[1]);
    this.audio.setSfxVolume(this.volumes[2]);

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.state = GameState.MAIN_MENU;
    this.menuIndex = 0;

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.mainCanvas.width = w;
    this.mainCanvas.height = h;

    this.scale = Math.max(1, Math.min(Math.floor(w / INTERNAL_W), Math.floor(h / INTERNAL_H)));
    const scaledW = INTERNAL_W * this.scale;
    const scaledH = INTERNAL_H * this.scale;
    this.offsetX = Math.floor((w - scaledW) / 2);
    this.offsetY = Math.floor((h - scaledH) / 2);

    this.input.updateTransform(this.scale, this.offsetX, this.offsetY);
    this.mainCtx.imageSmoothingEnabled = false;
  }

  loop(time: number): void {
    const dt = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += Math.min(dt, 250);

    while (this.accumulator >= FIXED_DT) {
      this.update();
      this.accumulator -= FIXED_DT;
    }

    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(): void {
    this.ui.update();

    if (document.hidden) {
      if (this.state === GameState.PLAYING) {
        this.prevState = this.state;
        this.state = GameState.PAUSED;
      }
      return;
    }

    switch (this.state) {
      case GameState.MAIN_MENU: this.updateMainMenu(); break;
      case GameState.PLAYING: this.updatePlaying(); break;
      case GameState.PAUSED: this.updatePaused(); break;
      case GameState.INVENTORY: this.updateInventory(); break;
      case GameState.SETTINGS: this.updateSettings(); break;
    }
  }

  // ---- MAIN MENU ----
  updateMainMenu(): void {
    const items = 3;
    if (this.input.isKeyJustPressed('ArrowUp') || this.input.isKeyJustPressed('KeyW')) {
      this.menuIndex = (this.menuIndex - 1 + items) % items;
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowDown') || this.input.isKeyJustPressed('KeyS')) {
      this.menuIndex = (this.menuIndex + 1) % items;
      this.audio.playUIHover();
    }

    if (this.input.isKeyJustPressed('Enter') || this.input.isKeyJustPressed('Space')) {
      this.audio.init();
      this.audio.resume();
      this.audio.playUIClick();

      switch (this.menuIndex) {
        case 0: this.startNewGame(); break;
        case 1:
          this.prevState = this.state;
          this.state = GameState.SETTINGS;
          this.settingsIndex = 0;
          this.rebindingKey = null;
          break;
        case 2: this.ui.showNotification('A sandbox adventure', 180); break;
      }
    }
  }

  startNewGame(): void {
    this.world = new World();
    // Find a safe spawn (never inside trees/walls/water so we don't start stuck)
    const spawn = this.world.findSpawnPosition(0, 0, 16, 16);
    this.player = new Player(spawn.x, spawn.y);
    this.inventory = new Inventory();
    // Give starting items
    this.inventory.addItem('wood', 10);
    this.inventory.addItem('stone', 10);
    this.inventory.addItem('sword_1');
    this.player.equippedWeapon = 'sword_1';
    this.player.hp = 6;
    this.player.maxHp = 6;
    this.player.coins = 0;
    this.placeMode = false;
    this.selectedSlot = 0;

    this.state = GameState.PLAYING;
    this.camX = this.player.x - INTERNAL_W / 2;
    this.camY = this.player.y - INTERNAL_H / 2;
  }

  // ---- PLAYING ----
  updatePlaying(): void {
    this.world.update();

    // Update help timer
    if (this.helpTimer > 0) {
      this.helpTimer--;
      if (this.helpTimer <= 0) {
        this.showHelp = false;
      }
    }

    const movement = this.input.getMovement();
    const pausePressed = this.input.isJustPressed('pause');
    const inventoryPressed = this.input.isJustPressed('inventory');
    const jumpPressed = this.input.isJustPressed('jump');

    if (pausePressed) {
      this.prevState = this.state;
      this.state = GameState.PAUSED;
      this.pauseMenuIndex = 0;
      this.audio.pauseMusic();
      return;
    }

    if (inventoryPressed) {
      this.prevState = this.state;
      this.state = GameState.INVENTORY;
      this.ui.inventoryOpen = true;
      this.ui.inventoryCursor = 0;
      return;
    }

    // Hotbar selection with number keys
    for (let i = 0; i < 9; i++) {
      if (this.input.isKeyJustPressed(`Digit${i + 1}`)) {
        this.selectedSlot = i;
      }
    }

    // Toggle place mode
    if (this.input.isJustPressed('toggleMode')) {
      this.placeMode = !this.placeMode;
    }

    // Cycle hotbar slots
    if (this.input.isJustPressed('hotbarPrev')) {
      this.selectedSlot = (this.selectedSlot - 1 + 9) % 9;
    }
    if (this.input.isJustPressed('hotbarNext')) {
      this.selectedSlot = (this.selectedSlot + 1) % 9;
    }

    // Attack / Break / Place
    const attackPressed = this.input.isJustPressed('attack') || this.input.isMouseJustPressed();

    if (attackPressed) {
      if (this.placeMode) {
        this.tryPlaceBlock();
      } else {
        this.player.startAttack(this.audio);
        this.tryBreakBlock();
      }
    }

    // Update player
    this.player.update(movement, false, jumpPressed, this.world, this.audio);

    // Update particles
    this.particles.update();

    // Camera
    this.updateCamera();

    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      this.shakeX = (Math.random() - 0.5) * 4;
      this.shakeY = (Math.random() - 0.5) * 4;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Walk particles
    if (this.player.state === PlayerState.WALK && Math.random() < 0.15) {
      this.particles.emit(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height,
        1, PALETTE.lightGray, 0.3, 10, 1
      );
    }
  }

  tryBreakBlock(): void {
    const dir = this.player.dir;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    let tx = Math.floor(px / TILE_SIZE);
    let ty = Math.floor(py / TILE_SIZE);

    switch (dir) {
      case Dir.UP: ty -= 1; break;
      case Dir.DOWN: ty += 1; break;
      case Dir.LEFT: tx -= 1; break;
      case Dir.RIGHT: tx += 1; break;
    }

    const tile = this.world.getTile(tx * TILE_SIZE, ty * TILE_SIZE);
    if (isBreakable(tile)) {
      const brokenTile = this.world.breakBlock(tx, ty);
      if (brokenTile !== null) {
        const itemId = tileToItem(brokenTile);
        if (itemId) {
          this.inventory.addItem(itemId);
          // Add to hotbar if not already there
          if (!this.hotbarItems.includes(itemId)) {
            const emptySlot = this.hotbarItems.indexOf('');
            if (emptySlot !== -1) {
              this.hotbarItems[emptySlot] = itemId;
            }
          }
        }
        
        // Play breaking sound
        this.audio.playBlockBreak();
        this.shakeTimer = 4;

        // Enhanced breaking animation - multiple particle bursts
        const particleColor = brokenTile === TileType.TREE ? PALETTE.brown :
          brokenTile === TileType.BUSH ? PALETTE.darkGreen :
            brokenTile === TileType.WALL ? PALETTE.lightGray : 
              brokenTile === TileType.FENCE ? PALETTE.brown : PALETTE.darkGray;
        
        // Main debris particles
        this.particles.emit(
          tx * TILE_SIZE + 8, ty * TILE_SIZE + 8,
          12, particleColor, 2, 25, 2, 0.1
        );
        
        // Secondary dust particles
        this.particles.emit(
          tx * TILE_SIZE + 8, ty * TILE_SIZE + 8,
          6, PALETTE.lightGray, 1, 15, 1, 0.05
        );
        
        // Sparkle effect
        this.particles.emit(
          tx * TILE_SIZE + 8, ty * TILE_SIZE + 8,
          4, PALETTE.white, 1.5, 10, 1
        );
        
        // Show item pickup notification
        if (itemId) {
          const item = ITEMS[itemId];
          if (item) {
            this.ui.showNotification(`+1 ${item.name}`, 60);
          }
        }
      }
    }
  }

  tryPlaceBlock(): void {
    const dir = this.player.dir;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    let tx = Math.floor(px / TILE_SIZE);
    let ty = Math.floor(py / TILE_SIZE);

    switch (dir) {
      case Dir.UP: ty -= 1; break;
      case Dir.DOWN: ty += 1; break;
      case Dir.LEFT: tx -= 1; break;
      case Dir.RIGHT: tx += 1; break;
    }

    // Check if we have the selected item
    const selectedItemId = this.hotbarItems[this.selectedSlot];
    if (!selectedItemId || !this.inventory.hasItem(selectedItemId)) return;

    const tile = itemToTile(selectedItemId);
    if (tile === null) return;

    // Don't place on player
    const blockRect: Rect = { x: tx * TILE_SIZE, y: ty * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
    const playerRect = this.player.getRect();
    if (blockRect.x < playerRect.x + playerRect.w && blockRect.x + blockRect.w > playerRect.x &&
      blockRect.y < playerRect.y + playerRect.h && blockRect.y + blockRect.h > playerRect.y) {
      return;
    }

    if (this.world.placeBlock(tx, ty, tile)) {
      this.inventory.removeItem(selectedItemId);
      this.audio.playPickup();
      this.particles.emit(
        tx * TILE_SIZE + 8, ty * TILE_SIZE + 8,
        4, PALETTE.white, 0.5, 10, 1
      );
    }
  }

  updateCamera(): void {
    this.targetCamX = this.player.x + this.player.width / 2 - INTERNAL_W / 2;
    this.targetCamY = this.player.y + this.player.height / 2 - INTERNAL_H / 2;

    this.camX = lerp(this.camX, this.targetCamX, 0.1);
    this.camY = lerp(this.camY, this.targetCamY, 0.1);

    this.camX = Math.round(this.camX);
    this.camY = Math.round(this.camY);
  }

  // ---- PAUSED ----
  updatePaused(): void {
    if (this.input.isJustPressed('pause')) {
      this.state = GameState.PLAYING;
      return;
    }

    const items = 3;
    if (this.input.isKeyJustPressed('ArrowUp')) {
      this.pauseMenuIndex = (this.pauseMenuIndex - 1 + items) % items;
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.pauseMenuIndex = (this.pauseMenuIndex + 1) % items;
      this.audio.playUIHover();
    }

    if (this.input.isKeyJustPressed('Enter') || this.input.isKeyJustPressed('Space')) {
      this.audio.playUIClick();
      switch (this.pauseMenuIndex) {
        case 0: this.state = GameState.PLAYING; break;
        case 1:
          this.prevState = this.state;
          this.state = GameState.SETTINGS;
          this.settingsIndex = 0;
          this.rebindingKey = null;
          break;
        case 2:
          this.state = GameState.MAIN_MENU;
          this.menuIndex = 0;
          break;
      }
    }
  }

  // ---- INVENTORY ----
  updateInventory(): void {
    if (this.input.isJustPressed('inventory') || this.input.isJustPressed('pause')) {
      this.ui.inventoryOpen = false;
      this.state = GameState.PLAYING;
      return;
    }

    if (this.input.isKeyJustPressed('ArrowUp')) {
      this.ui.inventoryCursor = Math.max(0, this.ui.inventoryCursor - 4);
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.ui.inventoryCursor = Math.min(15, this.ui.inventoryCursor + 4);
    }
    if (this.input.isKeyJustPressed('ArrowLeft')) {
      this.ui.inventoryCursor = Math.max(0, this.ui.inventoryCursor - 1);
    }
    if (this.input.isKeyJustPressed('ArrowRight')) {
      this.ui.inventoryCursor = Math.min(this.inventory.slots.length - 1, this.ui.inventoryCursor + 1);
    }

    if (this.input.isKeyJustPressed('Enter')) {
      if (this.ui.inventoryCursor < this.inventory.slots.length) {
        const slot = this.inventory.slots[this.ui.inventoryCursor];
        const item = ITEMS[slot.itemId];
        if (item && item.type === ItemType.CONSUMABLE && item.healAmount) {
          if (this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.healAmount);
            this.inventory.removeItem(slot.itemId);
            this.audio.playPickup();
          }
        } else if (item && item.type === ItemType.EQUIPMENT && item.damage) {
          this.player.equippedWeapon = item.id;
          this.player.damage = item.damage;
          this.audio.playPickup();
        }
      }
    }
  }

  // ---- SETTINGS ----
  updateSettings(): void {
    const totalItems = 15; // 3 volumes + 12 keybinds

    if (this.rebindingKey !== null) {
      const allKeys = [
        'KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyI', 'KeyJ',
        'KeyK', 'KeyL', 'KeyM', 'KeyN', 'KeyO', 'KeyP', 'KeyQ', 'KeyR', 'KeyS', 'KeyT',
        'KeyU', 'KeyV', 'KeyW', 'KeyX', 'KeyY', 'KeyZ',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'Enter', 'ShiftLeft', 'ShiftRight',
        'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
        'Digit6', 'Digit7', 'Digit8', 'Digit9',
      ];

      for (const key of allKeys) {
        if (this.input.isKeyJustPressed(key)) {
          if (key === 'Escape') { this.rebindingKey = null; break; }
          const action = this.rebindingKey as keyof typeof this.input.bindings;
          this.input.bindings[action] = [key];
          this.rebindingKey = null;
          this.audio.playUIClick();
          this.saveSettings();
          break;
        }
      }
      return;
    }

    if (this.input.isKeyJustPressed('ArrowUp')) {
      this.settingsIndex = (this.settingsIndex - 1 + totalItems) % totalItems;
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.settingsIndex = (this.settingsIndex + 1) % totalItems;
      this.audio.playUIHover();
    }

    if (this.settingsIndex < 3) {
      if (this.input.isKeyJustPressed('ArrowLeft')) {
        this.volumes[this.settingsIndex] = clamp(this.volumes[this.settingsIndex] - 0.1, 0, 1);
        this.applyVolumes();
      }
      if (this.input.isKeyJustPressed('ArrowRight')) {
        this.volumes[this.settingsIndex] = clamp(this.volumes[this.settingsIndex] + 0.1, 0, 1);
        this.applyVolumes();
      }
    }

    if (this.settingsIndex >= 3 && this.settingsIndex <= 14) {
      if (this.input.isKeyJustPressed('Enter')) {
        const keybindKeys = ['up', 'down', 'left', 'right', 'attack', 'jump', 'interact', 'inventory', 'pause', 'toggleMode', 'hotbarPrev', 'hotbarNext'];
        this.rebindingKey = keybindKeys[this.settingsIndex - 3];
        this.audio.playUIClick();
      }
    }

    if (this.input.isJustPressed('pause') || (this.settingsIndex === 15 && this.input.isKeyJustPressed('Enter'))) {
      this.state = this.prevState === GameState.PAUSED ? GameState.PAUSED : GameState.MAIN_MENU;
      this.saveSettings();
      this.audio.playUIClick();
    }
  }

  applyVolumes(): void {
    this.audio.setMasterVolume(this.volumes[0]);
    this.audio.setMusicVolume(this.volumes[1]);
    this.audio.setSfxVolume(this.volumes[2]);
  }

  saveSettings(): void {
    localStorage.setItem('shadows_settings', JSON.stringify({
      volumes: this.volumes,
      bindings: this.input.saveBindings(),
    }));
  }

  // ============================================================
  // RENDERING
  // ============================================================
  render(): void {
    const ctx = this.bufferCtx;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    switch (this.state) {
      case GameState.MAIN_MENU:
        this.ui.drawMainMenu(ctx, this.menuIndex, false);
        break;
      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.INVENTORY:
        this.renderGame(ctx);
        break;
      case GameState.SETTINGS:
        this.ui.drawSettings(ctx, this.settingsIndex, this.volumes, this.input.bindings, this.rebindingKey);
        break;
    }

    // Blit to main canvas
    this.mainCtx.fillStyle = PALETTE.black;
    this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.mainCtx.drawImage(
      this.bufferCanvas,
      this.offsetX, this.offsetY,
      INTERNAL_W * this.scale, INTERNAL_H * this.scale
    );
  }

  renderGame(ctx: CanvasRenderingContext2D): void {
    const cx = Math.floor(this.camX + this.shakeX);
    const cy = Math.floor(this.camY + this.shakeY);

    // Calculate visible tile range
    const startTX = Math.floor(cx / TILE_SIZE) - 1;
    const startTY = Math.floor(cy / TILE_SIZE) - 1;
    const endTX = Math.ceil((cx + INTERNAL_W) / TILE_SIZE) + 1;
    const endTY = Math.ceil((cy + INTERNAL_H) / TILE_SIZE) + 1;

    // ---- GROUND LAYER ----
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = this.world.getTile(tx * TILE_SIZE, ty * TILE_SIZE);
        const sx = tx * TILE_SIZE - cx;
        const sy = ty * TILE_SIZE - cy;

        let spriteName = '';
        switch (tile) {
          case TileType.GRASS: spriteName = 'tile_grass'; break;
          case TileType.PATH: spriteName = 'tile_path'; break;
          case TileType.FLOOR_STONE: spriteName = 'tile_floor_stone'; break;
          case TileType.WATER: spriteName = 'tile_water'; break;
          default:
            if (tile === TileType.WALL || tile === TileType.TREE || tile === TileType.BUSH ||
              tile === TileType.FENCE || tile === TileType.PILLAR) {
              spriteName = 'tile_grass';
            }
            break;
        }

        if (spriteName) {
          const sprite = this.sprites.get(spriteName);
          if (sprite) {
            ctx.drawImage(sprite.frames[0], Math.floor(sx), Math.floor(sy));
          }
        }
      }
    }

    // ---- SOLID TILES & OBJECTS ----
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = this.world.getTile(tx * TILE_SIZE, ty * TILE_SIZE);
        const sx = tx * TILE_SIZE - cx;
        const sy = ty * TILE_SIZE - cy;

        let spriteName = '';
        switch (tile) {
          case TileType.WALL: spriteName = 'tile_wall'; break;
          case TileType.TREE: spriteName = 'tile_tree_trunk'; break;
          case TileType.FENCE: spriteName = 'tile_fence'; break;
          case TileType.PILLAR: spriteName = 'tile_pillar'; break;
          case TileType.BUSH: spriteName = 'tile_bush'; break;
        }

        if (spriteName) {
          const sprite = this.sprites.get(spriteName);
          if (sprite) {
            ctx.drawImage(sprite.frames[0], Math.floor(sx), Math.floor(sy));
          }
        }
      }
    }

    // ---- ENTITIES ----
    this.drawPlayer(ctx, cx, cy);

    // ---- FOREGROUND (tree canopies) ----
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        if (this.world.getTile(tx * TILE_SIZE, ty * TILE_SIZE) === TileType.TREE) {
          const sx = tx * TILE_SIZE - cx;
          const sy = (ty - 1) * TILE_SIZE - cy;
          const canopy = this.sprites.get('tile_tree_canopy');
          if (canopy) {
            ctx.globalAlpha = 0.85;
            ctx.drawImage(canopy.frames[0], Math.floor(sx), Math.floor(sy));
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // ---- BLOCK HIGHLIGHT ----
    this.drawBlockHighlight(ctx, cx, cy);

    // ---- PARTICLES ----
    this.particles.draw(ctx, cx, cy);

    // ---- HUD ----
    this.ui.drawHUD(ctx, this.sprites,
      this.player.hp, this.player.maxHp, this.player.coins,
      null, this.player.equippedWeapon, 0, 0);

    // ---- HOTBAR ----
    this.drawHotbar(ctx);

    // ---- PLACE MODE INDICATOR ----
    if (this.placeMode) {
      ctx.fillStyle = PALETTE.green;
      ctx.font = '8px monospace';
      ctx.fillText('PLACE MODE [Q]', 4, INTERNAL_H - 30);
    } else {
      ctx.fillStyle = PALETTE.red;
      ctx.font = '8px monospace';
      ctx.fillText('BREAK MODE [Q]', 4, INTERNAL_H - 30);
    }

    // ---- HELP OVERLAY ----
    if (this.showHelp && this.helpTimer > 0) {
      this.drawHelpOverlay(ctx);
    }

    // ---- OVERLAYS ----
    this.ui.drawNotification(ctx);
    this.ui.drawInventory(ctx, this.inventory, this.sprites);

    if (this.state === GameState.PAUSED) {
      this.ui.drawPauseMenu(ctx, this.pauseMenuIndex);
    }
  }

  drawBlockHighlight(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const dir = this.player.dir;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    let tx = Math.floor(px / TILE_SIZE);
    let ty = Math.floor(py / TILE_SIZE);

    switch (dir) {
      case Dir.UP: ty -= 1; break;
      case Dir.DOWN: ty += 1; break;
      case Dir.LEFT: tx -= 1; break;
      case Dir.RIGHT: tx += 1; break;
    }

    const sx = tx * TILE_SIZE - cx;
    const sy = ty * TILE_SIZE - cy;

    ctx.strokeStyle = this.placeMode ? PALETTE.green : PALETTE.white;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.strokeRect(Math.floor(sx) + 0.5, Math.floor(sy) + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    ctx.globalAlpha = 1;
  }

  drawHotbar(ctx: CanvasRenderingContext2D): void {
    const slotSize = 18;
    const gap = 2;
    const totalW = 9 * (slotSize + gap) - gap;
    const startX = (INTERNAL_W - totalW) / 2;
    const startY = INTERNAL_H - slotSize - 4;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(startX - 2, startY - 2, totalW + 4, slotSize + 4);

    for (let i = 0; i < 9; i++) {
      const sx = startX + i * (slotSize + gap);
      const sy = startY;

      // Slot background
      ctx.fillStyle = i === this.selectedSlot ? PALETTE.indigo : PALETTE.darkGray;
      ctx.fillRect(sx, sy, slotSize, slotSize);

      // Border
      ctx.strokeStyle = i === this.selectedSlot ? PALETTE.yellow : PALETTE.lightGray;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, slotSize - 1, slotSize - 1);

      // Item icon
      const itemId = this.hotbarItems[i];
      if (itemId) {
        const item = ITEMS[itemId];
        if (item) {
          const iconSprite = this.sprites.get(item.icon);
          if (iconSprite) {
            ctx.drawImage(iconSprite.frames[0], sx + 5, sy + 5, 8, 8);
          }
          // Count
          const count = this.inventory.getCount(itemId);
          if (count > 1) {
            ctx.fillStyle = PALETTE.white;
            ctx.font = '6px monospace';
            ctx.fillText(`${count}`, sx + 1, sy + slotSize - 2);
          }
        }
      }

      // Slot number
      ctx.fillStyle = PALETTE.darkGray;
      ctx.font = '5px monospace';
      ctx.fillText(`${i + 1}`, sx + 1, sy + 6);
    }
  }

  drawHelpOverlay(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.min(1, this.helpTimer / 60);
    ctx.globalAlpha = alpha * 0.85;
    
    // Background
    const boxW = 200;
    const boxH = 80;
    const boxX = (INTERNAL_W - boxW) / 2;
    const boxY = 30;
    
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    ctx.globalAlpha = alpha;
    
    // Title
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = '10px monospace';
    const title = 'CONTROLS';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, boxX + (boxW - tw) / 2, boxY + 12);
    
    // Controls list
    ctx.fillStyle = PALETTE.white;
    ctx.font = '7px monospace';
    const controls = [
      'WASD/Arrows: Move',
      'Space/J: Break/Place Block',
      'Q: Toggle Break/Place Mode',
      'Z/X: Cycle Hotbar',
      '1-9: Select Hotbar Slot',
      'K/Shift: Jump',
      'I: Inventory',
    ];
    
    let y = boxY + 25;
    for (const line of controls) {
      ctx.fillText(line, boxX + 10, y);
      y += 9;
    }
    
    ctx.globalAlpha = 1;
  }

  drawPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const spriteName = this.player.getSpriteName();
    const sprite = this.sprites.get(spriteName);
    if (!sprite) return;

    const frame = sprite.frames[this.player.animFrame % sprite.frames.length];
    const px = Math.floor(this.player.x - cx);
    const py = Math.floor(this.player.y - cy - this.player.jumpVelocity);

    // Shadow when jumping
    if (this.player.isJumping) {
      ctx.fillStyle = PALETTE.black;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(px + 3, Math.floor(this.player.y - cy + 14), 10, 2);
      ctx.globalAlpha = 1;
    }

    // Flash during i-frames
    if (this.player.iFrames > 0 && Math.floor(this.player.iFrames / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Squash/stretch
    if (Math.abs(this.player.squash - 1) > 0.01) {
      ctx.save();
      const centerX = px + 8;
      const centerY = py + 16;
      ctx.translate(centerX, centerY);
      ctx.scale(1 / this.player.squash, this.player.squash);
      ctx.translate(-centerX, -centerY);
    }

    // Mirror for left
    if (this.player.dir === Dir.LEFT) {
      ctx.save();
      ctx.translate(px + 16, py);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(frame, px, py);
    }

    if (Math.abs(this.player.squash - 1) > 0.01) {
      ctx.restore();
    }

    ctx.globalAlpha = 1;

    // Attack slash
    if (this.player.state === PlayerState.ATTACK) {
      const hitbox = this.player.getAttackHitbox();
      if (hitbox) {
        ctx.fillStyle = PALETTE.white;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(
          Math.floor(hitbox.x - cx),
          Math.floor(hitbox.y - cy),
          hitbox.w, hitbox.h
        );
        ctx.globalAlpha = 1;
      }
    }
  }
}
