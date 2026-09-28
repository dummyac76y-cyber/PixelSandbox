// ============================================================
// ENGINE - Main game loop, state management, rendering
// ============================================================
import {
  GameState, PlayerState, EnemyState, EnemyType, Dir, AreaId,
  INTERNAL_W, INTERNAL_H, FIXED_DT, TILE_SIZE, PALETTE,
  aabbOverlap, clamp, lerp, TileType, Rect
} from './constants';
import { initSprites, SpriteSheet } from './sprites';
import { Input } from './input';
import { AudioManager } from './audio';
import { World } from './world';
import { Player, Enemy, NPC, ParticleSystem, DamageNumberSystem } from './entities';
import { UI } from './ui';
import { Inventory, QuestManager, SaveManager, ITEMS, SHOP_ITEMS } from './systems';

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
  quests: QuestManager;
  saveManager: SaveManager;
  particles: ParticleSystem;
  damageNumbers: DamageNumberSystem;

  // Entities
  player: Player;
  enemies: Enemy[] = [];
  npcs: NPC[] = [];

  // State
  state: GameState = GameState.BOOT;
  prevState: GameState = GameState.BOOT;
  menuIndex: number = 0;
  pauseMenuIndex: number = 0;
  settingsIndex: number = 0;
  gameOverMenuIndex: number = 0;

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
  hitstopTimer: number = 0;

  // Combat
  playerAttackHitEnemies: Set<number> = new Set();

  // Interaction
  nearbyInteractable: { type: string; x: number; y: number; data?: any } | null = null;

  // Boss
  bossActive: boolean = false;
  bossRef: Enemy | null = null;

  // Volumes
  volumes: number[] = [0.7, 0.4, 0.6]; // master, music, sfx

  // Dialogue tracking
  elderTalkCount: number = 0;
  choiceOffered: boolean = false;

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
    this.quests = new QuestManager();
    this.saveManager = new SaveManager();
    this.particles = new ParticleSystem();
    this.damageNumbers = new DamageNumberSystem();

    this.player = new Player(0, 0);

    // Quest completion callback
    this.quests.onComplete = () => {
      this.audio.playQuestComplete();
      this.ui.showNotification('Quest Complete!', 120);
    };
  }

  async init(): Promise<void> {
    // Init sprites
    this.sprites = initSprites();

    // Init input
    this.input.attach(this.mainCanvas);

    // Load settings
    const settings = this.saveManager.loadSettings();
    if (settings) {
      if (settings.volumes) this.volumes = settings.volumes;
      if (settings.bindings) this.input.loadBindings(settings.bindings);
    }
    this.audio.setMasterVolume(this.volumes[0]);
    this.audio.setMusicVolume(this.volumes[1]);
    this.audio.setSfxVolume(this.volumes[2]);

    // Handle resize
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Start in main menu
    this.state = GameState.MAIN_MENU;
    this.menuIndex = 0;

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.mainCanvas.width = w;
    this.mainCanvas.height = h;

    // Calculate integer scale
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

    // Cap accumulator to prevent spiral of death
    this.accumulator += Math.min(dt, 250);

    // Fixed timestep updates
    while (this.accumulator >= FIXED_DT) {
      this.update();
      this.accumulator -= FIXED_DT;
    }

    // Render
    this.render();

    // Clear just-pressed states
    this.input.endFrame();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(): void {
    this.ui.update();

    // Auto-pause on tab switch
    if (document.hidden) {
      if (this.state === GameState.PLAYING) {
        this.prevState = this.state;
        this.state = GameState.PAUSED;
      }
      return;
    }

    switch (this.state) {
      case GameState.BOOT:
        // Should not reach here
        break;

      case GameState.MAIN_MENU:
        this.updateMainMenu();
        break;

      case GameState.PLAYING:
        this.updatePlaying();
        break;

      case GameState.PAUSED:
        this.updatePaused();
        break;

      case GameState.INVENTORY:
        this.updateInventory();
        break;

      case GameState.DIALOGUE:
        this.updateDialogueState();
        break;

      case GameState.TRANSITION:
        if (!this.ui.updateTransition()) {
          this.state = GameState.PLAYING;
        }
        break;

      case GameState.GAME_OVER:
        this.updateGameOver();
        break;

      case GameState.VICTORY:
        this.updateVictory();
        break;

      case GameState.SETTINGS:
        this.updateSettings();
        break;

      case GameState.SHOP:
        this.updateShop();
        break;
    }
  }

  // ---- MAIN MENU ----
  updateMainMenu(): void {
    const items = 4;
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
        case 0: // New Game
          this.startNewGame();
          break;
        case 1: // Continue
          if (this.saveManager.hasSave()) {
            this.loadGame();
          }
          break;
        case 2: // Settings
          this.prevState = this.state;
          this.state = GameState.SETTINGS;
          this.settingsIndex = 0;
          break;
        case 3: // Credits
          this.ui.showNotification('A pixel adventure game', 180);
          break;
      }
    }
  }

  startNewGame(): void {
    this.world = new World();
    this.player = new Player(
      this.world.areas.get(AreaId.VILLAGE)!.playerSpawn.x,
      this.world.areas.get(AreaId.VILLAGE)!.playerSpawn.y
    );
    this.player.equippedWeapon = 'sword_1';
    this.inventory = new Inventory();
    this.inventory.addItem('sword_1');
    this.inventory.addItem('health_potion', 2);
    this.quests = new QuestManager();
    this.quests.onComplete = () => {
      this.audio.playQuestComplete();
      this.ui.showNotification('Quest Complete!', 120);
    };
    this.enemies = [];
    this.npcs = [];
    this.bossActive = false;
    this.bossRef = null;
    this.elderTalkCount = 0;
    this.choiceOffered = false;

    this.loadArea(AreaId.VILLAGE);
    this.state = GameState.TRANSITION;
    this.ui.transitionAlpha = 1;
    this.ui.transitionTarget = 0;
    this.audio.playMusic('village');
  }

  loadArea(areaId: AreaId): void {
    this.world.currentArea = areaId;
    const area = this.world.areas.get(areaId)!;

    // Spawn enemies
    this.enemies = [];
    for (const spawn of area.enemies) {
      const type = spawn.type as EnemyType;
      this.enemies.push(new Enemy(type, spawn.x, spawn.y));
    }

    // Spawn NPCs
    this.npcs = [];
    for (const spawn of area.npcs) {
      this.npcs.push(new NPC(spawn.type, spawn.x, spawn.y, spawn.name));
    }

    // Check boss
    this.bossActive = areaId === AreaId.BOSS_ARENA;
    this.bossRef = this.enemies.find(e => e.type === EnemyType.BOSS) || null;

    // Music
    this.audio.playMusic(area.music);
  }

  loadGame(): void {
    const data = this.saveManager.load();
    if (!data) {
      this.startNewGame();
      return;
    }

    this.world = new World();
    this.player = new Player(data.playerX, data.playerY);
    this.player.hp = data.hp;
    this.player.maxHp = data.maxHp;
    this.player.coins = data.coins;
    this.player.equippedWeapon = data.equippedWeapon;
    this.player.equippedShield = data.equippedShield;
    if (data.equippedWeapon === 'sword_2') this.player.damage = 2;
    else if (data.equippedWeapon === 'sword_3') this.player.damage = 3;
    if (data.equippedShield === 'shield_1') this.player.defense = 1;

    this.inventory = new Inventory();
    this.inventory.deserialize(data.inventory);

    this.quests = new QuestManager();
    this.quests.onComplete = () => {
      this.audio.playQuestComplete();
      this.ui.showNotification('Quest Complete!', 120);
    };
    this.quests.deserialize(data.quests);

    // Restore world state
    if (data.openedChests) {
      for (const c of data.openedChests) {
        this.world.openedChests.add(c);
      }
    }
    if (data.hasKey) {
      // Key already in inventory
    }

    this.loadArea(data.currentArea);
    this.state = GameState.TRANSITION;
    this.ui.transitionAlpha = 1;
    this.ui.transitionTarget = 0;
  }

  // ---- PLAYING ----
  updatePlaying(): void {
    // Hitstop
    if (this.hitstopTimer > 0) {
      this.hitstopTimer--;
      return;
    }

    // Update world
    this.world.update();

    // Player input
    const movement = this.input.getMovement();
    const attackPressed = this.input.isJustPressed('attack') || this.input.isMouseJustPressed();
    const interactPressed = this.input.isJustPressed('interact');
    const inventoryPressed = this.input.isJustPressed('inventory');
    const pausePressed = this.input.isJustPressed('pause');
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

    // Check for interactions
    this.nearbyInteractable = null;
    this.checkInteractions();

    if (interactPressed && this.nearbyInteractable) {
      this.handleInteraction(this.nearbyInteractable);
      return;
    }

    // Update player
    this.player.update(movement, attackPressed, jumpPressed, this.world, this.audio);

    // Player attack vs enemies
    if (this.player.state === PlayerState.ATTACK) {
      const hitbox = this.player.getAttackHitbox();
      if (hitbox) {
        for (const enemy of this.enemies) {
          if (!enemy.active || enemy.state === EnemyState.DEAD) continue;
          if (this.player.attackHitEntities.has(enemy.id)) continue;
          if (enemy.iFrames > 0) continue;

          if (aabbOverlap(hitbox, enemy.getRect())) {
            const killed = enemy.takeDamage(this.player.damage, this.player.x, this.player.y, this.audio);
            if (killed) {
              this.player.attackHitEntities.add(enemy.id);
              this.hitstopTimer = enemy.type === EnemyType.BOSS || enemy.type === EnemyType.BRUTE ? 6 : 4;
              this.shakeTimer = 5;

              // Particles
              this.particles.emit(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                5, PALETTE.white, 1.5, 15
              );

              // Damage number
              this.damageNumbers.spawn(enemy.x + enemy.width / 2, enemy.y, this.player.damage, PALETTE.yellow);

              // Quest progress
              if ((enemy.state as string) === EnemyState.DEAD) {
                this.quests.progressObjective('kill', enemy.type);
                // Drop coins
                const coinDrop = enemy.type === EnemyType.BOSS ? 50 :
                  enemy.type === EnemyType.BRUTE ? 5 :
                    enemy.type === EnemyType.CHARGER ? 3 : 1;
                this.player.coins += coinDrop;
                this.audio.playCoin();

                // Boss defeated
                if (enemy.type === EnemyType.BOSS) {
                  this.bossActive = false;
                  this.saveManager.deleteSave();
                  setTimeout(() => {
                    this.state = GameState.VICTORY;
                  }, 1000);
                }
              }
            }
          }
        }

        // Player attack vs breakables (bushes)
        const area = this.world.getArea();
        const tx = Math.floor((hitbox.x + hitbox.w / 2) / TILE_SIZE);
        const ty = Math.floor((hitbox.y + hitbox.h / 2) / TILE_SIZE);
        if (tx >= 0 && ty >= 0 && tx < area.width && ty < area.height) {
          if (area.map[ty][tx] === TileType.BUSH && !this.world.isBushBroken(tx, ty)) {
            this.world.breakBush(tx, ty);
            this.particles.emit(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, 8, PALETTE.darkGreen, 1, 20);
            // Chance to drop heart
            if (Math.random() < 0.3 && this.player.hp < this.player.maxHp) {
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
              this.particles.emit(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, 3, PALETTE.red, 0.5, 20);
            }
          }
        }
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.update(this.player, this.world, this.enemies, this.audio);
    }

    // Enemy attack vs player
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.state === EnemyState.DEAD) continue;
      if (enemy.attackActive && enemy.attackHitbox) {
        if (aabbOverlap(enemy.attackHitbox, this.player.getHurtbox())) {
          if (this.player.takeDamage(enemy.damage, enemy.x, enemy.y, this.audio)) {
            this.shakeTimer = 4;
            this.particles.emit(
              this.player.x + this.player.width / 2,
              this.player.y + this.player.height / 2,
              3, PALETTE.red, 1, 12
            );
          }
        }
      }
      // Swarmer touch damage
      if (enemy.type === EnemyType.SWARMER && enemy.state === EnemyState.ATTACK) {
        if (aabbOverlap(enemy.getRect(), this.player.getHurtbox())) {
          if (this.player.takeDamage(enemy.damage, enemy.x, enemy.y, this.audio)) {
            this.shakeTimer = 3;
          }
        }
      }
    }

    // Spike damage
    if (this.world.isDamageAt(this.player.x + this.player.width / 2, this.player.y + this.player.height)) {
      if (this.player.takeDamage(1, this.player.x, this.player.y + 10, this.audio)) {
        this.shakeTimer = 3;
      }
    }

    // Update NPCs
    for (const npc of this.npcs) {
      npc.update();
    }

    // Update particles
    this.particles.update();
    this.damageNumbers.update();

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

    // Check area exits
    if (this.player.state !== PlayerState.DEATH && this.player.state !== PlayerState.HURT) {
      const exit = this.world.checkExit(this.player.getRect());
      if (exit) {
        if (exit.requiresKey) {
          if (this.inventory.hasItem('dungeon_key')) {
            this.inventory.removeItem('dungeon_key');
            this.audio.playDoorOpen();
            this.transitionToArea(exit.targetArea, exit.targetX, exit.targetY);
          } else {
            this.ui.showNotification('The door is locked. Need a key!', 90);
          }
        } else {
          this.transitionToArea(exit.targetArea, exit.targetX, exit.targetY);
        }
      }
    }

    // Check death
    if (this.player.state === PlayerState.DEATH && this.player.deathTimer > 60) {
      this.state = GameState.GAME_OVER;
      this.gameOverMenuIndex = 0;
    }

    // Walk particles
    if (this.player.state === PlayerState.WALK && Math.random() < 0.2) {
      this.particles.emit(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height,
        1, PALETTE.lightGray, 0.3, 10, 1
      );
    }
  }

  transitionToArea(areaId: AreaId, x: number, y: number): void {
    this.ui.startTransition(() => {
      this.player.x = x;
      this.player.y = y;
      this.loadArea(areaId);
    });
    this.state = GameState.TRANSITION;
  }

  updateCamera(): void {
    const area = this.world.getArea();
    this.targetCamX = this.player.x + this.player.width / 2 - INTERNAL_W / 2;
    this.targetCamY = this.player.y + this.player.height / 2 - INTERNAL_H / 2;

    // Clamp to map bounds
    this.targetCamX = clamp(this.targetCamX, 0, area.width * TILE_SIZE - INTERNAL_W);
    this.targetCamY = clamp(this.targetCamY, 0, area.height * TILE_SIZE - INTERNAL_H);

    // Smooth follow
    this.camX = lerp(this.camX, this.targetCamX, 0.1);
    this.camY = lerp(this.camY, this.targetCamY, 0.1);

    // Snap to integer
    this.camX = Math.round(this.camX);
    this.camY = Math.round(this.camY);
  }

  checkInteractions(): void {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    const interactRange = 20;

    // Check doors first (highest priority)
    const area = this.world.getArea();
    const playerTileX = Math.floor(px / TILE_SIZE);
    const playerTileY = Math.floor(py / TILE_SIZE);
    
    // Check adjacent tiles for doors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = playerTileX + dx;
        const ty = playerTileY + dy;
        if (tx >= 0 && ty >= 0 && tx < area.width && ty < area.height) {
          if (area.map[ty][tx] === TileType.DOOR) {
            const doorX = tx * TILE_SIZE + 8;
            const doorY = ty * TILE_SIZE + 8;
            if (Math.abs(px - doorX) < interactRange && Math.abs(py - doorY) < interactRange) {
              this.nearbyInteractable = { type: 'door', x: doorX, y: doorY - 12, data: { tx, ty, area: this.world.currentArea } };
              return;
            }
          }
        }
      }
    }

    // Check NPCs
    for (const npc of this.npcs) {
      const nx = npc.x + npc.width / 2;
      const ny = npc.y + npc.height / 2;
      if (Math.abs(px - nx) < interactRange && Math.abs(py - ny) < interactRange) {
        this.nearbyInteractable = { type: 'npc', x: nx, y: ny - 12, data: npc };
        return;
      }
    }

    // Check chests
    for (const chest of area.chests) {
      if (this.world.openedChests.has(chest.id)) continue;
      const cx = chest.x + 8;
      const cy = chest.y + 8;
      if (Math.abs(px - cx) < interactRange && Math.abs(py - cy) < interactRange) {
        this.nearbyInteractable = { type: 'chest', x: cx, y: cy - 12, data: chest };
        return;
      }
    }

    // Check signs
    for (const sign of area.signs) {
      const sx = sign.x + 8;
      const sy = sign.y + 8;
      if (Math.abs(px - sx) < interactRange && Math.abs(py - sy) < interactRange) {
        this.nearbyInteractable = { type: 'sign', x: sx, y: sy - 12, data: sign };
        return;
      }
    }
  }

  handleInteraction(interactable: { type: string; data: any }): void {
    switch (interactable.type) {
      case 'door':
        this.enterDoor(interactable.data);
        break;
      case 'npc':
        this.talkToNPC(interactable.data as NPC);
        break;
      case 'chest':
        this.openChest(interactable.data);
        break;
      case 'sign':
        this.readSign(interactable.data);
        break;
    }
  }

  talkToNPC(npc: NPC): void {
    if (npc.name === 'Elder Morin') {
      this.elderTalkCount++;
      this.quests.progressObjective('talk', 'elder');

      if (this.elderTalkCount === 1) {
        this.ui.startDialogue('Elder Morin', [
          'Ah, brave adventurer! The darkness spreads from the Ancient Ruins.',
          'First, prove your courage - defeat 5 slimes in the Whispering Woods.',
          'Then seek the dungeon key hidden deep in the Ruins.',
          'Come back to me after proving yourself!',
        ]);
        this.state = GameState.DIALOGUE;
      } else if (this.elderTalkCount === 2 && !this.choiceOffered) {
        this.choiceOffered = true;
        this.ui.startDialogue('Elder Morin', [
          'Before you go, choose your blessing:',
        ], undefined, ['Power (Better Sword)', 'Wisdom (Shield)']);
        this.state = GameState.DIALOGUE;
        // Handle choice after dialogue ends
        this.ui.dialogueCallback = () => {
          if (this.ui.lastChoice.includes('Power') || this.ui.lastChoice.includes('Sword')) {
            this.quests.makeChoice('power');
            this.inventory.addItem('sword_2');
            this.ui.showNotification('Received Steel Blade!', 90);
          } else {
            this.quests.makeChoice('wisdom');
            this.inventory.addItem('shield_1');
            this.player.defense = 1;
            this.player.equippedShield = 'shield_1';
            this.ui.showNotification('Received Wooden Shield!', 90);
          }
          this.state = GameState.PLAYING;
        };
      } else {
        let line = 'May the light guide you, hero.';
        if (this.quests.choiceMade === 'power') {
          line = 'Wield that blade wisely, hero. Its power is great.';
        } else if (this.quests.choiceMade === 'wisdom') {
          line = 'Your shield will protect you. Stay strong!';
        }
        this.ui.startDialogue('Elder Morin', [line]);
        this.state = GameState.DIALOGUE;
      }
    } else if (npc.name === 'Merchant Gill') {
      this.ui.startDialogue('Merchant Gill', [
        'Welcome to my shop! Press E to browse my wares.',
      ]);
      this.state = GameState.DIALOGUE;
      this.ui.dialogueCallback = () => {
        this.state = GameState.SHOP;
        this.ui.shopOpen = true;
        this.ui.shopCursor = 0;
        this.ui.shopMessage = '';
      };
    } else if (npc.name === 'Villager Pip') {
      const lines = this.quests.getCurrentQuest()?.id === 'quest_2' ?
        ['Be careful in the woods! The slimes have been multiplying.', 'Try attacking them when they get close!'] :
        ['You\'re the hero the elder was talking about?', 'Good luck out there!'];
      this.ui.startDialogue('Villager Pip', lines);
      this.state = GameState.DIALOGUE;
    }
  }

  openChest(chest: any): void {
    this.world.openedChests.add(chest.id);
    this.audio.playChestOpen();

    // Sparkle particles
    this.particles.emit((chest.x || 0) + 8, (chest.y || 0) + 4, 10, PALETTE.yellow, 1.5, 25, 1);

    // Add item
    if (chest.item === 'dungeon_key') {
      this.inventory.addItem('dungeon_key');
      this.quests.progressObjective('collect', 'dungeon_key');
      this.ui.showNotification('Got Dungeon Key!', 90);
    } else if (chest.item === 'sword_2') {
      this.inventory.addItem('sword_2');
      this.ui.showNotification('Got Steel Blade!', 90);
    } else {
      this.inventory.addItem(chest.item);
      const item = ITEMS[chest.item];
      this.ui.showNotification(`Got ${item?.name || chest.item}!`, 90);
    }
  }

  readSign(sign: { text: string }): void {
    this.ui.startDialogue('', [sign.text]);
    this.state = GameState.DIALOGUE;
  }

  enterDoor(doorData: any): void {
    const { area, tx, ty } = doorData;
    
    // Determine which house this door leads to based on location
    if (area === AreaId.VILLAGE) {
      // Check which house door this is
      if (tx === 8 && ty === 8) {
        // Elder's house
        this.audio.playDoorOpen();
        this.transitionToArea(AreaId.VILLAGE_HOUSE, 8 * TILE_SIZE, 8 * TILE_SIZE);
      } else if (tx === 33 && ty === 8) {
        // Merchant's house - just show dialogue
        this.ui.startDialogue('', ["The shop is outside. Talk to the merchant directly!"], () => {
          this.state = GameState.PLAYING;
        });
      } else if (tx === 8 && ty === 24) {
        // Villager's house
        this.audio.playDoorOpen();
        this.transitionToArea(AreaId.VILLAGE_HOUSE, 8 * TILE_SIZE, 8 * TILE_SIZE);
      }
    } else if (area === AreaId.VILLAGE_HOUSE) {
      // Exit house back to village
      this.audio.playDoorOpen();
      this.transitionToArea(AreaId.VILLAGE, 8 * TILE_SIZE, 9 * TILE_SIZE);
    }
  }

  // ---- PAUSED ----
  updatePaused(): void {
    if (this.input.isJustPressed('pause')) {
      this.state = GameState.PLAYING;
      this.audio.resumeMusic();
      return;
    }

    const items = 4;
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
        case 0: // Resume
          this.state = GameState.PLAYING;
          this.audio.resumeMusic();
          break;
        case 1: // Save
          this.saveGame();
          this.ui.showNotification('Game Saved!', 60);
          break;
        case 2: // Settings
          this.prevState = this.state;
          this.state = GameState.SETTINGS;
          this.settingsIndex = 0;
          break;
        case 3: // Main Menu
          this.state = GameState.MAIN_MENU;
          this.menuIndex = 0;
          this.audio.stopMusic();
          break;
      }
    }
  }

  saveGame(): void {
    const data: any = {
      version: 1,
      playerX: this.player.x,
      playerY: this.player.y,
      currentArea: this.world.currentArea,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      coins: this.player.coins,
      inventory: this.inventory.serialize(),
      equippedWeapon: this.player.equippedWeapon,
      equippedShield: this.player.equippedShield,
      quests: this.quests.serialize(),
      choiceFlags: { choice: this.quests.choiceMade },
      openedChests: Array.from(this.world.openedChests),
      defeatedBoss: !this.bossActive && this.world.currentArea === AreaId.BOSS_ARENA,
      hasKey: this.inventory.hasItem('dungeon_key'),
    };
    this.saveManager.save(data);
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
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.ui.inventoryCursor = Math.min(15, this.ui.inventoryCursor + 4);
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowLeft')) {
      this.ui.inventoryCursor = Math.max(0, this.ui.inventoryCursor - 1);
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowRight')) {
      this.ui.inventoryCursor = Math.min(this.inventory.slots.length - 1, this.ui.inventoryCursor + 1);
      this.audio.playUIHover();
    }

    if (this.input.isKeyJustPressed('Enter')) {
      if (this.ui.inventoryCursor < this.inventory.slots.length) {
        const slot = this.inventory.slots[this.ui.inventoryCursor];
        const item = ITEMS[slot.itemId];
        if (item) {
          if (item.type === 'CONSUMABLE' && item.healAmount) {
            if (this.player.hp < this.player.maxHp) {
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.healAmount);
              this.inventory.removeItem(slot.itemId);
              this.audio.playPickup();
              this.ui.showNotification(`Used ${item.name}! +${item.healAmount} HP`, 60);
            } else {
              this.ui.showNotification('HP is already full!', 60);
              this.audio.playUIError();
            }
          } else if (item.type === 'EQUIPMENT' && item.damage) {
            this.player.equippedWeapon = item.id;
            this.player.damage = item.damage;
            this.audio.playPickup();
            this.ui.showNotification(`Equipped ${item.name}!`, 60);
          } else if (item.type === 'EQUIPMENT' && item.defense) {
            this.player.equippedShield = item.id;
            this.player.defense = item.defense;
            this.audio.playPickup();
            this.ui.showNotification(`Equipped ${item.name}!`, 60);
          }
        }
      }
    }
  }

  // ---- DIALOGUE STATE ----
  updateDialogueState(): void {
    const advance = this.input.isKeyJustPressed('Space') || this.input.isKeyJustPressed('Enter');
    const up = this.input.isKeyJustPressed('ArrowUp');
    const down = this.input.isKeyJustPressed('ArrowDown');
    
    // Also allow ESC to close dialogue
    if (this.input.isKeyJustPressed('Escape')) {
      this.ui.dialogueActive = false;
      this.state = GameState.PLAYING;
      return;
    }
    
    this.ui.updateDialogue(advance, up, down);

    if (!this.ui.dialogueActive) {
      // Dialogue ended, return to playing
      this.state = GameState.PLAYING;
    }
  }

  // ---- SETTINGS ----
  updateSettings(): void {
    const items = 4;
    if (this.input.isKeyJustPressed('ArrowUp')) {
      this.settingsIndex = (this.settingsIndex - 1 + items) % items;
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.settingsIndex = (this.settingsIndex + 1) % items;
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

    if (this.input.isJustPressed('pause') || (this.settingsIndex === 3 && this.input.isKeyJustPressed('Enter'))) {
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
    this.saveManager.saveSettings({
      volumes: this.volumes,
      bindings: this.input.saveBindings(),
    });
  }

  // ---- SHOP ----
  updateShop(): void {
    if (this.input.isJustPressed('interact') || this.input.isJustPressed('pause')) {
      this.ui.shopOpen = false;
      this.state = GameState.PLAYING;
      return;
    }

    if (this.input.isKeyJustPressed('ArrowUp')) {
      this.ui.shopCursor = Math.max(0, this.ui.shopCursor - 1);
      this.audio.playUIHover();
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.ui.shopCursor = Math.min(SHOP_ITEMS.length - 1, this.ui.shopCursor + 1);
      this.audio.playUIHover();
    }

    if (this.input.isKeyJustPressed('Enter')) {
      const si = SHOP_ITEMS[this.ui.shopCursor];
      if (this.player.coins >= si.price) {
        if (this.inventory.addItem(si.itemId)) {
          this.player.coins -= si.price;
          this.audio.playCoin();
          this.ui.shopMessage = `Bought ${ITEMS[si.itemId].name}!`;

          // Auto-equip if it's equipment
          const item = ITEMS[si.itemId];
          if (item.damage && item.damage > this.player.damage) {
            this.player.equippedWeapon = item.id;
            this.player.damage = item.damage;
          }
          if (item.defense && item.defense > this.player.defense) {
            this.player.equippedShield = item.id;
            this.player.defense = item.defense;
          }
        } else {
          this.ui.shopMessage = 'Inventory full!';
          this.audio.playUIError();
        }
      } else {
        this.ui.shopMessage = 'Not enough coins!';
        this.audio.playUIError();
      }
    }
  }

  // ---- GAME OVER ----
  updateGameOver(): void {
    if (this.input.isKeyJustPressed('ArrowUp')) {
      this.gameOverMenuIndex = 0;
    }
    if (this.input.isKeyJustPressed('ArrowDown')) {
      this.gameOverMenuIndex = 1;
    }

    if (this.input.isKeyJustPressed('Enter') || this.input.isKeyJustPressed('Space')) {
      this.audio.playUIClick();
      if (this.gameOverMenuIndex === 0) {
        // Reload checkpoint
        if (this.saveManager.hasSave()) {
          this.loadGame();
        } else {
          this.startNewGame();
        }
      } else {
        this.state = GameState.MAIN_MENU;
        this.menuIndex = 0;
        this.audio.stopMusic();
      }
    }
  }

  // ---- VICTORY ----
  updateVictory(): void {
    if (this.input.isKeyJustPressed('Enter') || this.input.isKeyJustPressed('Space')) {
      this.state = GameState.MAIN_MENU;
      this.menuIndex = 0;
      this.audio.stopMusic();
    }
  }

  // ============================================================
  // RENDERING
  // ============================================================
  render(): void {
    const ctx = this.bufferCtx;
    ctx.imageSmoothingEnabled = false;

    // Clear buffer
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

    switch (this.state) {
      case GameState.MAIN_MENU:
        this.ui.drawMainMenu(ctx, this.menuIndex, this.saveManager.hasSave());
        break;

      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.INVENTORY:
      case GameState.DIALOGUE:
      case GameState.TRANSITION:
      case GameState.SHOP:
        this.renderGame(ctx);
        break;

      case GameState.SETTINGS:
        this.ui.drawSettings(ctx, this.settingsIndex, this.volumes);
        break;

      case GameState.GAME_OVER:
        this.renderGame(ctx);
        this.ui.drawGameOver(ctx, this.gameOverMenuIndex);
        break;

      case GameState.VICTORY:
        this.ui.drawVictory(ctx);
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
    const area = this.world.getArea();
    const cx = Math.floor(this.camX + this.shakeX);
    const cy = Math.floor(this.camY + this.shakeY);

    // Calculate visible tile range
    const startTX = Math.max(0, Math.floor(cx / TILE_SIZE) - 1);
    const startTY = Math.max(0, Math.floor(cy / TILE_SIZE) - 1);
    const endTX = Math.min(area.width, Math.ceil((cx + INTERNAL_W) / TILE_SIZE) + 1);
    const endTY = Math.min(area.height, Math.ceil((cy + INTERNAL_H) / TILE_SIZE) + 1);

    // ---- GROUND LAYER ----
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = area.map[ty][tx];
        const sx = tx * TILE_SIZE - cx;
        const sy = ty * TILE_SIZE - cy;

        let spriteName = '';
        switch (tile) {
          case TileType.GRASS: spriteName = 'tile_grass'; break;
          case TileType.PATH: spriteName = 'tile_path'; break;
          case TileType.FLOOR_STONE: spriteName = 'tile_floor_stone'; break;
          case TileType.FLOOR_WOOD: spriteName = 'tile_floor_wood'; break;
          case TileType.WATER: spriteName = 'tile_water'; break;
          default:
            // For solid tiles, draw ground underneath
            if (tile === TileType.WALL || tile === TileType.HOUSE_WALL) {
              spriteName = 'tile_grass';
            } else if (tile === TileType.TREE) {
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

    // ---- DETAIL/COLLISION LAYER (solid tiles, objects) ----
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = area.map[ty][tx];
        const sx = tx * TILE_SIZE - cx;
        const sy = ty * TILE_SIZE - cy;

        let spriteName = '';
        switch (tile) {
          case TileType.WALL: spriteName = 'tile_wall'; break;
          case TileType.TREE: spriteName = 'tile_tree_trunk'; break;
          case TileType.HOUSE_WALL: spriteName = 'tile_house_wall'; break;
          case TileType.ROOF: spriteName = 'tile_roof'; break;
          case TileType.DOOR: spriteName = 'tile_door'; break;
          case TileType.FENCE: spriteName = 'tile_fence'; break;
          case TileType.PILLAR: spriteName = 'tile_pillar'; break;
          case TileType.BOSS_DOOR: spriteName = 'tile_boss_door'; break;
          case TileType.BUSH:
            if (!this.world.isBushBroken(tx, ty)) {
              spriteName = 'tile_bush';
            }
            break;
          case TileType.SPIKE:
            // Draw spike only when active
            if (this.world.isSpikeActive()) {
              ctx.fillStyle = PALETTE.lightGray;
              ctx.fillRect(Math.floor(sx) + 4, Math.floor(sy) + 4, 2, 8);
              ctx.fillRect(Math.floor(sx) + 8, Math.floor(sy) + 2, 2, 10);
              ctx.fillRect(Math.floor(sx) + 12, Math.floor(sy) + 4, 2, 8);
            } else {
              ctx.fillStyle = PALETTE.darkGray;
              ctx.fillRect(Math.floor(sx) + 4, Math.floor(sy) + 10, 2, 4);
              ctx.fillRect(Math.floor(sx) + 8, Math.floor(sy) + 10, 2, 4);
              ctx.fillRect(Math.floor(sx) + 12, Math.floor(sy) + 10, 2, 4);
            }
            break;
        }

        // Draw chests
        for (const chest of area.chests) {
          const ctx2 = Math.floor(chest.x / TILE_SIZE);
          const cty = Math.floor(chest.y / TILE_SIZE);
          if (ctx2 === tx && cty === ty && !this.world.openedChests.has(chest.id)) {
            const csprite = this.sprites.get('tile_chest');
            if (csprite) {
              ctx.drawImage(csprite.frames[0], Math.floor(chest.x - cx), Math.floor(chest.y - cy));
            }
          }
        }

        // Draw signs
        for (const sign of area.signs) {
          const sctx = Math.floor(sign.x / TILE_SIZE);
          const scty = Math.floor(sign.y / TILE_SIZE);
          if (sctx === tx && scty === ty) {
            const ssprite = this.sprites.get('tile_sign');
            if (ssprite) {
              ctx.drawImage(ssprite.frames[0], Math.floor(sign.x - cx), Math.floor(sign.y - cy));
            }
          }
        }

        if (spriteName) {
          const sprite = this.sprites.get(spriteName);
          if (sprite) {
            ctx.drawImage(sprite.frames[0], Math.floor(sx), Math.floor(sy));
          }
        }
      }
    }

    // ---- ENTITIES (y-sorted) ----
    interface DrawEntity { y: number; draw: () => void; }
    const drawList: DrawEntity[] = [];

    // Player
    drawList.push({
      y: this.player.y + this.player.height,
      draw: () => this.drawPlayer(ctx, cx, cy),
    });

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.active && enemy.deathTimer > 30) continue;
      drawList.push({
        y: enemy.y + enemy.height,
        draw: () => this.drawEnemy(ctx, enemy, cx, cy),
      });
    }

    // NPCs
    for (const npc of this.npcs) {
      drawList.push({
        y: npc.y + npc.height,
        draw: () => this.drawNPC(ctx, npc, cx, cy),
      });
    }

    // Sort by bottom Y
    drawList.sort((a, b) => a.y - b.y);
    for (const entity of drawList) {
      entity.draw();
    }

    // ---- FOREGROUND LAYER (tree canopies) ----
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        if (area.map[ty][tx] === TileType.TREE) {
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

    // ---- PARTICLES ----
    this.particles.draw(ctx, cx, cy);
    this.damageNumbers.draw(ctx, cx, cy);

    // ---- INTERACTION PROMPT ----
    if (this.nearbyInteractable && this.state === GameState.PLAYING) {
      this.ui.drawInteractionPrompt(
        ctx,
        this.nearbyInteractable.x - cx - 4,
        this.nearbyInteractable.y - cy
      );
    }

    // ---- HUD ----
    const quest = this.quests.getCurrentQuest();
    const bossHp = this.bossRef ? this.bossRef.hp : 0;
    const bossMaxHp = this.bossRef ? this.bossRef.maxHp : 0;
    this.ui.drawHUD(ctx, this.sprites,
      this.player.hp, this.player.maxHp, this.player.coins,
      quest, this.player.equippedWeapon,
      this.bossActive ? bossHp : 0,
      this.bossActive ? bossMaxHp : 0
    );

    // ---- OVERLAYS ----
    this.ui.drawNotification(ctx);
    this.ui.drawDialogue(ctx);
    this.ui.drawInventory(ctx, this.inventory, this.sprites);
    this.ui.drawShop(ctx, this.player.coins, this.inventory, this.sprites);
    this.ui.drawTransition(ctx);

    // Pause overlay
    if (this.state === GameState.PAUSED) {
      this.ui.drawPauseMenu(ctx, this.pauseMenuIndex);
    }
  }

  drawPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const spriteName = this.player.getSpriteName();
    const sprite = this.sprites.get(spriteName);
    if (!sprite) return;

    const frame = sprite.frames[this.player.animFrame % sprite.frames.length];
    const px = Math.floor(this.player.x - cx);
    // Apply jump offset (subtract jumpVelocity to move up visually)
    const py = Math.floor(this.player.y - cy - this.player.jumpVelocity);

    // Draw shadow when jumping
    if (this.player.isJumping) {
      ctx.fillStyle = PALETTE.black;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(px + 8, Math.floor(this.player.y - cy + 14), 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Flash white during i-frames
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

    // Mirror for left direction
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

    // Draw attack slash effect
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

  drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, cx: number, cy: number): void {
    const sprite = this.sprites.get(enemy.spriteName);
    if (!sprite) return;

    const frame = sprite.frames[enemy.stateTimer % sprite.frames.length] || sprite.frames[0];
    const ex = Math.floor(enemy.x - cx);
    const ey = Math.floor(enemy.y - cy);

    // Death fade
    if (enemy.state === EnemyState.DEAD) {
      ctx.globalAlpha = 1 - enemy.deathTimer / 30;
    }

    // Flash white/red during hurt/telegraph
    if (enemy.state === EnemyState.HURT) {
      ctx.globalAlpha = 0.7;
    }
    if (enemy.state === EnemyState.TELEGRAPH) {
      // Flash red
      const flash = Math.floor(enemy.stateTimer / 3) % 2;
      if (flash) {
        ctx.fillStyle = PALETTE.red;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(ex, ey, enemy.width, enemy.height);
        ctx.globalAlpha = 1;
      }
    }

    // i-frames flash
    if (enemy.iFrames > 0 && Math.floor(enemy.iFrames / 2) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Mirror for left
    if (enemy.dir === Dir.LEFT) {
      ctx.save();
      ctx.translate(ex + enemy.width, ey);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, 0, enemy.width, enemy.height);
      ctx.restore();
    } else {
      ctx.drawImage(frame, ex, ey, enemy.width, enemy.height);
    }

    ctx.globalAlpha = 1;

    // HP bar for non-dead enemies
    if (enemy.state !== EnemyState.DEAD && enemy.hp < enemy.maxHp) {
      const barW = enemy.width;
      const barH = 2;
      const barX = ex;
      const barY = ey - 4;
      ctx.fillStyle = PALETTE.darkGray;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(barX, barY, Math.floor((enemy.hp / enemy.maxHp) * barW), barH);
    }

    // Attack hitbox visualization (debug-like, but subtle)
    if (enemy.attackActive && enemy.attackHitbox) {
      ctx.fillStyle = PALETTE.red;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        Math.floor(enemy.attackHitbox.x - cx),
        Math.floor(enemy.attackHitbox.y - cy),
        enemy.attackHitbox.w, enemy.attackHitbox.h
      );
      ctx.globalAlpha = 1;
    }
  }

  drawNPC(ctx: CanvasRenderingContext2D, npc: NPC, cx: number, cy: number): void {
    const sprite = this.sprites.get(npc.spriteName);
    if (!sprite) return;

    const frame = sprite.frames[npc.animFrame % sprite.frames.length];
    const nx = Math.floor(npc.x - cx);
    const ny = Math.floor(npc.y - cy);

    ctx.drawImage(frame, nx, ny);
  }
}
