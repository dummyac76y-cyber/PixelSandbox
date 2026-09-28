// ============================================================
// PHYSICS - 3D AABB voxel collision, gravity, jumping, stepping
// ============================================================
import { BlockType, BLOCK_DEFS } from './blocks';
import { World3D } from './world3d';

export interface PlayerPhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isGrounded: boolean;
  isFlying: boolean;
  isInWater: boolean;
}

export class PhysicsController {
  // Player AABB dimensions
  static readonly WIDTH = 0.5;
  static readonly HEIGHT = 1.75;
  static readonly EYE_HEIGHT = 1.62;

  // Constants
  static readonly GRAVITY = -24.0;
  static readonly JUMP_FORCE = 8.2;
  static readonly MOVE_SPEED = 5.2;
  static readonly SPRINT_SPEED = 8.5;
  static readonly FLY_SPEED = 10.0;
  static readonly STEP_HEIGHT = 0.6; // step climbing height

  state: PlayerPhysicsState;
  world: World3D;

  constructor(world: World3D, spawn: { x: number; y: number; z: number }) {
    this.world = world;
    this.state = {
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      vx: 0,
      vy: 0,
      vz: 0,
      isGrounded: false,
      isFlying: false,
      isInWater: false,
    };
  }

  // Check if a block at coordinate is solid for collision
  private isSolidBlock(x: number, y: number, z: number): boolean {
    const b = this.world.getBlock(x, y, z);
    if (b === BlockType.AIR || b === BlockType.WATER) return false;
    const def = BLOCK_DEFS[b];
    return def ? !def.transparent || b === BlockType.GLASS || b === BlockType.LEAVES : false;
  }

  // AABB collision test against world blocks in the vicinity
  private collidesWithWorld(px: number, py: number, pz: number): boolean {
    const halfW = PhysicsController.WIDTH / 2;
    const minX = Math.floor(px - halfW);
    const maxX = Math.floor(px + halfW);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + PhysicsController.HEIGHT);
    const minZ = Math.floor(pz - halfW);
    const maxZ = Math.floor(pz + halfW);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.isSolidBlock(x, y, z)) {
            // Check box overlap
            const bMinX = x;
            const bMaxX = x + 1;
            const bMinY = y;
            const bMaxY = y + 1;
            const bMinZ = z;
            const bMaxZ = z + 1;

            if (
              px + halfW > bMinX &&
              px - halfW < bMaxX &&
              py + PhysicsController.HEIGHT > bMinY &&
              py < bMaxY &&
              pz + halfW > bMinZ &&
              pz - halfW < bMaxZ
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  update(
    dt: number,
    input: { forward: number; strafe: number; jump: boolean; sprint: boolean; flyUp: boolean; flyDown: boolean },
    yaw: number
  ): void {
    // Clamp delta time to avoid physics tunneling
    const dtClamped = Math.min(dt, 0.05);

    // Water check at torso level
    const waistBlock = this.world.getBlock(Math.floor(this.state.x), Math.floor(this.state.y + 0.8), Math.floor(this.state.z));
    this.state.isInWater = waistBlock === BlockType.WATER;

    // Creative Flying Mode
    if (this.state.isFlying) {
      const speed = input.sprint ? PhysicsController.FLY_SPEED * 1.5 : PhysicsController.FLY_SPEED;

      // Movement vector (Three.js camera looks down -Z at yaw=0)
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const moveX = (-sin * input.forward + cos * input.strafe) * speed;
      const moveZ = (-cos * input.forward - sin * input.strafe) * speed;
      let moveY = 0;
      if (input.flyUp || input.jump) moveY = speed;
      if (input.flyDown) moveY = -speed;

      this.state.x += moveX * dtClamped;
      this.state.y += moveY * dtClamped;
      this.state.z += moveZ * dtClamped;
      this.state.vx = 0;
      this.state.vy = 0;
      this.state.vz = 0;
      this.state.isGrounded = false;
      return;
    }

    // Normal Walk / Run Physics
    const targetSpeed = input.sprint ? PhysicsController.SPRINT_SPEED : PhysicsController.MOVE_SPEED;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);

    // Desired horizontal velocity (W = forward (-Z), S = backward (+Z), A = left (-X), D = right (+X))
    const targetVx = (-sin * input.forward + cos * input.strafe) * targetSpeed;
    const targetVz = (-cos * input.forward - sin * input.strafe) * targetSpeed;

    // Smooth horizontal acceleration
    const accel = this.state.isGrounded ? 18.0 : 8.0;
    this.state.vx += (targetVx - this.state.vx) * Math.min(1.0, accel * dtClamped);
    this.state.vz += (targetVz - this.state.vz) * Math.min(1.0, accel * dtClamped);

    // Gravity / Jumping
    if (this.state.isInWater) {
      this.state.vy = input.jump ? 3.0 : -1.5;
    } else {
      if (this.state.isGrounded) {
        if (input.jump) {
          this.state.vy = PhysicsController.JUMP_FORCE;
          this.state.isGrounded = false;
        } else {
          this.state.vy = -0.5; // slight stick to ground
        }
      } else {
        this.state.vy += PhysicsController.GRAVITY * dtClamped;
        this.state.vy = Math.max(-30.0, this.state.vy);
      }
    }

    // Step Movement Resolution (X, then Z, then Y) with Step-Up support
    const dx = this.state.vx * dtClamped;
    const dy = this.state.vy * dtClamped;
    const dz = this.state.vz * dtClamped;

    // Move X
    if (dx !== 0) {
      const nextX = this.state.x + dx;
      if (!this.collidesWithWorld(nextX, this.state.y, this.state.z)) {
        this.state.x = nextX;
      } else if (this.state.isGrounded && !this.collidesWithWorld(nextX, this.state.y + PhysicsController.STEP_HEIGHT, this.state.z)) {
        // Auto-step up 0.5-0.6m blocks
        this.state.x = nextX;
        this.state.y += PhysicsController.STEP_HEIGHT;
      } else {
        this.state.vx = 0;
      }
    }

    // Move Z
    if (dz !== 0) {
      const nextZ = this.state.z + dz;
      if (!this.collidesWithWorld(this.state.x, this.state.y, nextZ)) {
        this.state.z = nextZ;
      } else if (this.state.isGrounded && !this.collidesWithWorld(this.state.x, this.state.y + PhysicsController.STEP_HEIGHT, nextZ)) {
        // Auto-step up
        this.state.z = nextZ;
        this.state.y += PhysicsController.STEP_HEIGHT;
      } else {
        this.state.vz = 0;
      }
    }

    // Move Y
    this.state.isGrounded = false;
    if (dy !== 0) {
      const nextY = this.state.y + dy;
      if (!this.collidesWithWorld(this.state.x, nextY, this.state.z)) {
        this.state.y = nextY;
      } else {
        if (dy < 0) {
          // Hit floor
          this.state.isGrounded = true;
          // Snap to integer block top
          this.state.y = Math.floor(nextY) + 1;
        } else {
          // Hit ceiling
        }
        this.state.vy = 0;
      }
    }

    // Fall out of world safeguard
    if (this.state.y < -10) {
      const spawn = this.world.getSpawnPosition();
      this.state.x = spawn.x;
      this.state.y = spawn.y + 2;
      this.state.z = spawn.z;
      this.state.vx = 0;
      this.state.vy = 0;
      this.state.vz = 0;
    }
  }

  getEyePosition(): { x: number; y: number; z: number } {
    return {
      x: this.state.x,
      y: this.state.y + PhysicsController.EYE_HEIGHT,
      z: this.state.z,
    };
  }
}
