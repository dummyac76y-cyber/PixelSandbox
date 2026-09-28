// ============================================================
// ENTITIES - Player, Enemies, NPCs, Particles
// ============================================================
import {
  PlayerState, EnemyState, EnemyType, Dir, Rect, Vec2,
  aabbOverlap, dist, clamp, dirToVec, TILE_SIZE
} from './constants';
import { World } from './world';
import { AudioManager } from './audio';

// ============================================================
// PARTICLE SYSTEM (object-pooled)
// ============================================================
export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

const MAX_PARTICLES = 200;

export class ParticleSystem {
  particles: Particle[] = [];

  constructor() {
    // Pre-allocate
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false, x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, color: '#fff', size: 1, gravity: 0,
      });
    }
  }

  emit(x: number, y: number, count: number, color: string, speed: number, life: number, size: number = 1, gravity: number = 0): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active && spawned < count) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.5 + Math.random() * 0.5);
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.life = life;
        p.maxLife = life;
        p.color = color;
        p.size = size;
        p.gravity = gravity;
        spawned++;
      }
    }
  }

  emitDirectional(x: number, y: number, count: number, color: string, dirX: number, dirY: number, speed: number, life: number): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active && spawned < count) {
        p.active = true;
        p.x = x;
        p.y = y;
        const spread = 0.5;
        p.vx = dirX * speed + (Math.random() - 0.5) * spread;
        p.vy = dirY * speed + (Math.random() - 0.5) * spread;
        p.life = life;
        p.maxLife = life;
        p.color = color;
        p.size = 1;
        p.gravity = 0;
        spawned++;
      }
    }
  }

  update(): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) p.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x - camX), Math.floor(p.y - camY), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// PLAYER
// ============================================================
export class Player {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = 16;
  height: number = 16;
  hurtboxW: number = 10;
  hurtboxH: number = 10;
  speed: number = 1.5;
  dir: Dir = Dir.DOWN;
  state: PlayerState = PlayerState.IDLE;
  hp: number = 6;
  maxHp: number = 6;
  coins: number = 0;
  damage: number = 1;
  defense: number = 0;

  // Attack
  attackTimer: number = 0;
  attackStartup: number = 3;
  attackActive: number = 4;
  attackRecovery: number = 6;
  attackHitbox: Rect | null = null;
  attackHitEntities: Set<number> = new Set();

  // Hurt
  hurtTimer: number = 0;
  iFrames: number = 0;
  knockbackVx: number = 0;
  knockbackVy: number = 0;

  // Animation
  animFrame: number = 0;
  animTimer: number = 0;
  squash: number = 1;

  // Death
  deathTimer: number = 0;

  // Interact
  interactTimer: number = 0;

  // Jump
  jumpVelocity: number = 0;
  isJumping: boolean = false;
  jumpHeight: number = 8; // pixels to rise
  jumpDuration: number = 0;
  jumpMaxDuration: number = 12; // ticks for jump arc

  // Equipment
  equippedWeapon: string = 'sword_1';
  equippedShield: string = '';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getRect(): Rect {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  getHurtbox(): Rect {
    const ox = (this.width - this.hurtboxW) / 2;
    const oy = this.height - this.hurtboxH;
    return { x: this.x + ox, y: this.y + oy, w: this.hurtboxW, h: this.hurtboxH };
  }

  getAttackHitbox(): Rect | null {
    if (this.state !== PlayerState.ATTACK) return null;
    if (this.attackTimer < this.attackStartup || this.attackTimer >= this.attackStartup + this.attackActive) return null;

    const dv = dirToVec(this.dir);
    const hbW = 14;
    const hbH = 14;
    let hx = this.x + this.width / 2 - hbW / 2 + dv.x * 14;
    let hy = this.y + this.height / 2 - hbH / 2 + dv.y * 14;
    return { x: hx, y: hy, w: hbW, h: hbH };
  }

  update(input: { x: number; y: number }, attackPressed: boolean, jumpPressed: boolean, world: World, audio: AudioManager): void {
    // Decrease timers
    if (this.iFrames > 0) this.iFrames--;
    this.squash += (1 - this.squash) * 0.2;

    // Handle jump physics
    if (this.isJumping) {
      this.jumpDuration++;
      // Parabolic arc: rise then fall
      const t = this.jumpDuration / this.jumpMaxDuration;
      const jumpOffset = this.jumpHeight * 4 * t * (1 - t); // parabola peaking at t=0.5
      this.jumpVelocity = jumpOffset;
      
      if (this.jumpDuration >= this.jumpMaxDuration) {
        this.isJumping = false;
        this.jumpDuration = 0;
        this.jumpVelocity = 0;
        this.state = PlayerState.IDLE;
        this.squash = 0.85; // Landing squash
        // Landing dust particles will be emitted by the engine
      }
    }

    switch (this.state) {
      case PlayerState.IDLE:
      case PlayerState.WALK:
        this.handleMovement(input, world);
        if (jumpPressed && !this.isJumping) {
          this.startJump(audio);
        }
        if (attackPressed) {
          this.startAttack(audio);
        }
        break;

      case PlayerState.JUMP:
        // Allow movement during jump
        this.handleMovement(input, world);
        if (attackPressed) {
          this.startAttack(audio);
        }
        break;

      case PlayerState.ATTACK:
        this.attackTimer++;
        // Allow slight movement during recovery
        if (this.attackTimer >= this.attackStartup + this.attackActive) {
          this.handleMovement(input, world);
        }
        if (this.attackTimer >= this.attackStartup + this.attackActive + this.attackRecovery) {
          this.state = PlayerState.IDLE;
          this.attackTimer = 0;
          this.attackHitbox = null;
          this.attackHitEntities.clear();
        }
        break;

      case PlayerState.HURT:
        this.hurtTimer--;
        this.x += this.knockbackVx;
        this.y += this.knockbackVy;
        this.knockbackVx *= 0.8;
        this.knockbackVy *= 0.8;
        // Resolve collision after knockback
        this.x = world.resolveX(this.getHurtbox(), 0);
        this.y = world.resolveY(this.getHurtbox(), 0);
        if (this.hurtTimer <= 0) {
          this.state = PlayerState.IDLE;
        }
        break;

      case PlayerState.DEATH:
        this.deathTimer++;
        break;

      case PlayerState.INTERACT:
        this.interactTimer--;
        if (this.interactTimer <= 0) {
          this.state = PlayerState.IDLE;
        }
        break;
    }

    // Animation
    this.animTimer++;
    if (this.animTimer >= 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Safety net: never stay stuck inside solid geometry (e.g. after
    // knockback, spawning into a wall, or blocks placed around us)
    if (world.checkCollision(this.getHurtbox())) {
      const free = world.unstick(this.getHurtbox());
      const ox = (this.width - this.hurtboxW) / 2;
      const oy = this.height - this.hurtboxH;
      this.x = free.x - ox;
      this.y = free.y - oy;
    }
  }

  private handleMovement(input: { x: number; y: number }, world: World): void {
    if (input.x === 0 && input.y === 0) {
      this.vx *= 0.7;
      this.vy *= 0.7;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      if (Math.abs(this.vy) < 0.1) this.vy = 0;
      if (this.state === PlayerState.WALK) this.state = PlayerState.IDLE;
    } else {
      this.vx = input.x * this.speed;
      this.vy = input.y * this.speed;
      this.state = PlayerState.WALK;

      // Update facing direction
      if (Math.abs(input.x) > Math.abs(input.y)) {
        this.dir = input.x > 0 ? Dir.RIGHT : Dir.LEFT;
      } else {
        this.dir = input.y > 0 ? Dir.DOWN : Dir.UP;
      }
    }

    // Apply velocity with collision (separate axes, with wall sliding/snapping)
    const hb = this.getHurtbox();
    const newX = world.resolveX(hb, this.vx);
    this.x += newX - hb.x;
    const newY = world.resolveY(this.getHurtbox(), this.vy);
    this.y += newY - this.getHurtbox().y;

    // Infinite world - no bounds clamping needed
  }

  startAttack(audio: AudioManager): void {
    this.state = PlayerState.ATTACK;
    this.attackTimer = 0;
    this.attackHitEntities.clear();
    this.squash = 0.8;
    audio.playSwordSwing();
  }

  startJump(audio: AudioManager): void {
    this.isJumping = true;
    this.jumpDuration = 0;
    this.state = PlayerState.JUMP;
    this.squash = 1.2; // Stretch up on jump
    audio.playJump();
  }

  takeDamage(amount: number, fromX: number, fromY: number, audio: AudioManager): boolean {
    if (this.iFrames > 0 || this.state === PlayerState.DEATH) return false;

    // Apply defense
    const finalDamage = Math.max(1, amount - this.defense);
    this.hp -= finalDamage;
    this.iFrames = 30; // Half second of i-frames
    this.state = PlayerState.HURT;
    this.hurtTimer = 15;
    this.squash = 1.3;

    // Knockback away from damage source
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.knockbackVx = (dx / d) * 3;
    this.knockbackVy = (dy / d) * 3;

    audio.playHurt();

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = PlayerState.DEATH;
      this.deathTimer = 0;
    }
    return true;
  }

  getSpriteName(): string {
    const dirStr = this.dir === Dir.DOWN || this.dir === Dir.UP ?
      (this.dir === Dir.DOWN ? 'down' : 'up') : 'down';

    switch (this.state) {
      case PlayerState.ATTACK:
        return `player_attack_${dirStr}`;
      case PlayerState.WALK:
        return `player_walk_${dirStr}`;
      case PlayerState.JUMP:
        return `player_jump_${dirStr}`;
      default:
        return `player_idle_${dirStr}`;
    }
  }
}

// ============================================================
// ENEMY BASE
// ============================================================
export class Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = 16;
  height: number = 16;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  dir: Dir = Dir.DOWN;
  state: EnemyState = EnemyState.IDLE;
  spriteName: string;

  // AI
  aggroRadius: number = 80;
  leashRadius: number = 160;
  attackRange: number = 20;
  stateTimer: number = 0;
  patrolTarget: Vec2 = { x: 0, y: 0 };
  attackCooldown: number = 0;

  // Combat
  iFrames: number = 0;
  hurtTimer: number = 0;
  knockbackVx: number = 0;
  knockbackVy: number = 0;
  knockbackResist: number = 1;

  // Death
  deathTimer: number = 0;
  active: boolean = true;

  // Attack hitbox
  attackHitbox: Rect | null = null;
  attackActive: boolean = false;
  attackDuration: number = 0;

  // Swarmer specific
  sineOffset: number = 0;

  // Charger specific
  chargeDir: Vec2 = { x: 0, y: 0 };
  chargeSpeed: number = 3;

  // Brute specific
  telegraphTimer: number = 0;

  // Boss specific
  phase: number = 1;
  summonCooldown: number = 0;

  static nextId = 0;

  constructor(type: EnemyType, x: number, y: number) {
    this.id = Enemy.nextId++;
    this.type = type;
    this.x = x;
    this.y = y;
    this.patrolTarget = { x, y };

    switch (type) {
      case EnemyType.SWARMER:
        this.hp = 2;
        this.maxHp = 2;
        this.damage = 1;
        this.speed = 0.8;
        this.aggroRadius = 64;
        this.leashRadius = 128;
        this.attackRange = 12;
        this.spriteName = 'slime';
        this.knockbackResist = 0.5;
        this.sineOffset = Math.random() * Math.PI * 2;
        break;
      case EnemyType.CHARGER:
        this.hp = 4;
        this.maxHp = 4;
        this.damage = 2;
        this.speed = 0.6;
        this.aggroRadius = 96;
        this.leashRadius = 160;
        this.attackRange = 24;
        this.spriteName = 'skeleton';
        this.knockbackResist = 0.8;
        break;
      case EnemyType.BRUTE:
        this.hp = 8;
        this.maxHp = 8;
        this.damage = 3;
        this.speed = 0.4;
        this.width = 20;
        this.height = 20;
        this.aggroRadius = 80;
        this.leashRadius = 140;
        this.attackRange = 22;
        this.spriteName = 'golem';
        this.knockbackResist = 2;
        break;
      case EnemyType.BOSS:
        this.hp = 20;
        this.maxHp = 20;
        this.damage = 3;
        this.speed = 0.5;
        this.width = 24;
        this.height = 24;
        this.aggroRadius = 200;
        this.leashRadius = 300;
        this.attackRange = 30;
        this.spriteName = 'boss';
        this.knockbackResist = 3;
        break;
    }
  }

  getRect(): Rect {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  getCenter(): Vec2 {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  update(player: Player, world: World, enemies: Enemy[], audio: AudioManager): void {
    if (!this.active) return;
    if (this.iFrames > 0) this.iFrames--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    const center = this.getCenter();
    const playerCenter = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
    const d = dist(center.x, center.y, playerCenter.x, playerCenter.y);

    switch (this.state) {
      case EnemyState.IDLE:
        this.stateTimer++;
        if (this.stateTimer > 30) {
          this.state = EnemyState.PATROL;
          this.stateTimer = 0;
          this.pickPatrolPoint(world);
        }
        if (d < this.aggroRadius && player.state !== PlayerState.DEATH) {
          this.state = EnemyState.CHASE;
          this.stateTimer = 0;
        }
        break;

      case EnemyState.PATROL:
        this.moveToward(this.patrolTarget.x, this.patrolTarget.y, this.speed * 0.5, world);
        if (dist(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y) < 4) {
          this.state = EnemyState.IDLE;
          this.stateTimer = 0;
        }
        if (d < this.aggroRadius && player.state !== PlayerState.DEATH) {
          this.state = EnemyState.CHASE;
          this.stateTimer = 0;
        }
        break;

      case EnemyState.CHASE:
        if (d > this.leashRadius || player.state === PlayerState.DEATH) {
          this.state = EnemyState.IDLE;
          this.stateTimer = 0;
          break;
        }
        if (d < this.attackRange && this.attackCooldown <= 0) {
          this.state = EnemyState.TELEGRAPH;
          this.stateTimer = 0;
          this.telegraphTimer = this.getTelegraphDuration();
          break;
        }
        this.moveToward(playerCenter.x, playerCenter.y, this.speed, world);
        // Update facing
        this.updateFacing(playerCenter.x, playerCenter.y);
        // Separation from other enemies
        this.applySeparation(enemies);
        break;

      case EnemyState.TELEGRAPH:
        this.stateTimer++;
        // Flash red during telegraph (handled in draw)
        if (this.stateTimer >= this.telegraphTimer) {
          this.state = EnemyState.ATTACK;
          this.stateTimer = 0;
          this.startAttack(player, audio);
        }
        break;

      case EnemyState.ATTACK:
        this.stateTimer++;
        this.updateAttack(player, world, audio);
        break;

      case EnemyState.HURT:
        this.hurtTimer--;
        this.x += this.knockbackVx;
        this.y += this.knockbackVy;
        this.knockbackVx *= 0.7;
        this.knockbackVy *= 0.7;
        // Resolve collision (snap to walls instead of hard-stopping)
        this.x = world.resolveX(this.getRect(), this.knockbackVx);
        this.y = world.resolveY(this.getRect(), this.knockbackVy);

        if (this.hurtTimer <= 0) {
          this.state = EnemyState.CHASE;
          this.stateTimer = 0;
        }
        break;

      case EnemyState.DEAD:
        this.deathTimer++;
        if (this.deathTimer > 30) {
          this.active = false;
        }
        break;
    }

    // Boss phase check
    if (this.type === EnemyType.BOSS && this.phase === 1 && this.hp <= this.maxHp / 2) {
      this.phase = 2;
      this.speed = 0.7;
      this.summonCooldown = 60;
    }
  }

  private getTelegraphDuration(): number {
    switch (this.type) {
      case EnemyType.SWARMER: return 5;
      case EnemyType.CHARGER: return 15;
      case EnemyType.BRUTE: return 20;
      case EnemyType.BOSS: return this.phase === 1 ? 20 : 15;
    }
  }

  private startAttack(player: Player, audio: AudioManager): void {
    this.attackActive = true;
    this.attackDuration = 0;

    switch (this.type) {
      case EnemyType.SWARMER:
        // Touch attack - just move toward player
        this.attackDuration = 10;
        break;
      case EnemyType.CHARGER:
        // Dash attack
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        this.chargeDir = { x: dx / d, y: dy / d };
        this.attackDuration = 20;
        break;
      case EnemyType.BRUTE:
        // Wide swing
        this.attackDuration = 15;
        break;
      case EnemyType.BOSS:
        if (this.phase === 2 && this.stateTimer === 0) {
          // Charge dash in phase 2
          const dx2 = player.x - this.x;
          const dy2 = player.y - this.y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
          this.chargeDir = { x: dx2 / d2, y: dy2 / d2 };
          this.attackDuration = 25;
        } else {
          this.attackDuration = 15;
        }
        break;
    }
  }

  private updateAttack(player: Player, world: World, audio: AudioManager): void {
    switch (this.type) {
      case EnemyType.SWARMER:
        // Move toward player during attack
        const pc = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
        this.moveToward(pc.x, pc.y, this.speed * 1.5, world);
        // Check hit
        if (aabbOverlap(this.getRect(), player.getHurtbox())) {
          if (player.takeDamage(this.damage, this.x, this.y, audio)) {
            // Hit connected
          }
        }
        break;

      case EnemyType.CHARGER:
        // Dash (resolve with wall snapping)
        this.vx = this.chargeDir.x * this.chargeSpeed;
        this.vy = this.chargeDir.y * this.chargeSpeed;
        this.x = world.resolveX(this.getRect(), this.vx);
        this.y = world.resolveY(this.getRect(), this.vy);
        // Check hit
        if (aabbOverlap(this.getRect(), player.getHurtbox())) {
          player.takeDamage(this.damage, this.x, this.y, audio);
        }
        break;

      case EnemyType.BRUTE:
      case EnemyType.BOSS:
        // Swing attack - create hitbox in facing direction
        const dv = dirToVec(this.dir);
        const hbSize = this.type === EnemyType.BOSS ? 24 : 20;
        this.attackHitbox = {
          x: this.x + this.width / 2 - hbSize / 2 + dv.x * 18,
          y: this.y + this.height / 2 - hbSize / 2 + dv.y * 18,
          w: hbSize,
          h: hbSize,
        };
        if (this.attackHitbox && aabbOverlap(this.attackHitbox, player.getHurtbox())) {
          player.takeDamage(this.damage, this.x, this.y, audio);
        }

        // Boss phase 2: charge attack
        if (this.type === EnemyType.BOSS && this.phase === 2 && this.attackDuration > 15) {
          this.vx = this.chargeDir.x * this.chargeSpeed;
          this.vy = this.chargeDir.y * this.chargeSpeed;
          this.x = world.resolveX(this.getRect(), this.vx);
          this.y = world.resolveY(this.getRect(), this.vy);
        }
        break;
    }

    this.attackDuration--;
    if (this.attackDuration <= 0) {
      this.state = EnemyState.CHASE;
      this.stateTimer = 0;
      this.attackActive = false;
      this.attackHitbox = null;
      this.attackCooldown = this.getAttackCooldown();
    }
  }

  private getAttackCooldown(): number {
    switch (this.type) {
      case EnemyType.SWARMER: return 30;
      case EnemyType.CHARGER: return 60;
      case EnemyType.BRUTE: return 90;
      case EnemyType.BOSS: return this.phase === 1 ? 80 : 50;
    }
  }

  private moveToward(tx: number, ty: number, speed: number, world: World): void {
    const dx = tx - (this.x + this.width / 2);
    const dy = ty - (this.y + this.height / 2);
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    // Swarmer sine wave movement
    let moveX = (dx / d) * speed;
    let moveY = (dy / d) * speed;

    if (this.type === EnemyType.SWARMER) {
      this.sineOffset += 0.1;
      const perpX = -dy / d;
      const perpY = dx / d;
      moveX += perpX * Math.sin(this.sineOffset) * 0.5;
      moveY += perpY * Math.sin(this.sineOffset) * 0.5;
    }

    // Apply with collision (resolveX/Y snaps to walls and pushes out if stuck)
    this.x = world.resolveX(this.getRect(), moveX);
    this.y = world.resolveY(this.getRect(), moveY);

    this.updateFacing(tx, ty);
  }

  private updateFacing(tx: number, ty: number): void {
    const dx = tx - (this.x + this.width / 2);
    const dy = ty - (this.y + this.height / 2);
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = dx > 0 ? Dir.RIGHT : Dir.LEFT;
    } else {
      this.dir = dy > 0 ? Dir.DOWN : Dir.UP;
    }
  }

  private applySeparation(enemies: Enemy[]): void {
    const sepDist = 20;
    for (const other of enemies) {
      if (other === this || !other.active || other.state === EnemyState.DEAD) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < sepDist && d > 0) {
        const force = (sepDist - d) / sepDist * 0.3;
        this.x += (dx / d) * force;
        this.y += (dy / d) * force;
      }
    }
  }

  private pickPatrolPoint(world: World): void {
    let attempts = 0;
    while (attempts < 10) {
      const px = this.x + (Math.random() - 0.5) * 80;
      const py = this.y + (Math.random() - 0.5) * 80;
      if (!world.isSolidAt(px, py)) {
        this.patrolTarget = { x: px, y: py };
        return;
      }
      attempts++;
    }
  }

  takeDamage(amount: number, fromX: number, fromY: number, audio: AudioManager): boolean {
    if (this.iFrames > 0 || this.state === EnemyState.DEAD) return false;

    this.hp -= amount;
    this.iFrames = 10;
    this.state = EnemyState.HURT;
    this.hurtTimer = 8;

    // Knockback
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const kb = 3 / this.knockbackResist;
    this.knockbackVx = (dx / d) * kb;
    this.knockbackVy = (dy / d) * kb;

    audio.playHit();

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = EnemyState.DEAD;
      this.deathTimer = 0;
      this.active = true; // Still active for death animation
      audio.playEnemyDeath();
    }
    return true;
  }
}

// ============================================================
// NPC
// ============================================================
export class NPC {
  x: number;
  y: number;
  width: number = 16;
  height: number = 16;
  spriteName: string;
  name: string;
  animFrame: number = 0;
  animTimer: number = 0;

  constructor(spriteName: string, x: number, y: number, name: string) {
    this.spriteName = spriteName;
    this.x = x;
    this.y = y;
    this.name = name;
  }

  getRect(): Rect {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  update(): void {
    this.animTimer++;
    if (this.animTimer >= 20) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 3;
    }
  }
}

// ============================================================
// DAMAGE NUMBER (floating text)
// ============================================================
export interface DamageNumber {
  active: boolean;
  x: number;
  y: number;
  value: number;
  life: number;
  color: string;
}

const MAX_DAMAGE_NUMBERS = 20;

export class DamageNumberSystem {
  numbers: DamageNumber[] = [];

  constructor() {
    for (let i = 0; i < MAX_DAMAGE_NUMBERS; i++) {
      this.numbers.push({ active: false, x: 0, y: 0, value: 0, life: 0, color: '#fff' });
    }
  }

  spawn(x: number, y: number, value: number, color: string = '#fff'): void {
    for (const n of this.numbers) {
      if (!n.active) {
        n.active = true;
        n.x = x;
        n.y = y;
        n.value = value;
        n.life = 30;
        n.color = color;
        return;
      }
    }
  }

  update(): void {
    for (const n of this.numbers) {
      if (!n.active) continue;
      n.y -= 0.5;
      n.life--;
      if (n.life <= 0) n.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    ctx.font = '8px monospace';
    for (const n of this.numbers) {
      if (!n.active) continue;
      ctx.globalAlpha = n.life / 30;
      ctx.fillStyle = n.color;
      ctx.fillText(String(n.value), Math.floor(n.x - camX), Math.floor(n.y - camY));
    }
    ctx.globalAlpha = 1;
  }
}
