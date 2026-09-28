// ============================================================
// PLAYER MODEL 3D - Voxel avatar for third-person & 2.5D views
// ============================================================
import * as THREE from 'three';
import { ITEM_DEFS } from './resources';
import { createHeldItemMesh } from './resourceRegistry';

export class PlayerModel3D {
  scene: THREE.Scene;
  group: THREE.Group;

  // Body parts
  head: THREE.Mesh;
  body: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  heldItemMesh: THREE.Object3D | null = null;
  heldItemAnchor: THREE.Group;

  walkTime = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Skin & clothing materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x00bcd4, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Head (0.4 x 0.4 x 0.4)
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.45, 0);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Hair cap
    const hairGeo = new THREE.BoxGeometry(0.42, 0.12, 0.42);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.16, 0);
    this.head.add(hair);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.04, 0.02);
    const leftEyeW = new THREE.Mesh(eyeGeo, whiteMat);
    leftEyeW.position.set(-0.1, 0.02, -0.21);
    this.head.add(leftEyeW);
    const leftEyeP = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), eyeMat);
    leftEyeP.position.set(-0.1, 0.02, -0.22);
    this.head.add(leftEyeP);

    const rightEyeW = new THREE.Mesh(eyeGeo, whiteMat);
    rightEyeW.position.set(0.1, 0.02, -0.21);
    this.head.add(rightEyeW);
    const rightEyeP = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), eyeMat);
    rightEyeP.position.set(0.1, 0.02, -0.22);
    this.head.add(rightEyeP);

    // Torso / Body (0.42 x 0.55 x 0.22)
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.55, 0.22);
    this.body = new THREE.Mesh(bodyGeo, shirtMat);
    this.body.position.set(0, 0.95, 0);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Left Arm (pivot at shoulder)
    const armGeo = new THREE.BoxGeometry(0.14, 0.52, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.3, 0.95, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    // Right Arm (pivot at shoulder)
    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.3, 0.95, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // Held Item Anchor on right hand
    this.heldItemAnchor = new THREE.Group();
    this.heldItemAnchor.position.set(0, -0.22, -0.15);
    this.rightArm.add(this.heldItemAnchor);

    // Left Leg
    const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.11, 0.35, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.11, 0.35, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    this.group.visible = false;
    this.scene.add(this.group);
  }

  // Update position, rotation and walk animation
  update(
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    isMoving: boolean,
    isSwinging: boolean,
    swingProgress: number,
    dt: number
  ): void {
    this.group.position.set(x, y, z);
    this.group.rotation.y = yaw;

    // Head pitch
    this.head.rotation.x = pitch * 0.7;

    if (isMoving) {
      this.walkTime += dt * 10.0;
      const legSwing = Math.sin(this.walkTime) * 0.6;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      if (!isSwinging) {
        this.leftArm.rotation.x = -legSwing * 0.8;
        this.rightArm.rotation.x = legSwing * 0.8;
      }
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      if (!isSwinging) {
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
      }
    }

    // Arm swing when mining/placing
    if (isSwinging) {
      const arc = Math.sin(swingProgress * Math.PI);
      this.rightArm.rotation.x = -0.8 - arc * 0.9;
    }
  }

  // Update item held in third-person right hand
  updateHeldItem(itemId: string | null): void {
    if (this.heldItemMesh) {
      this.heldItemAnchor.remove(this.heldItemMesh);
      this.heldItemMesh.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
      this.heldItemMesh = null;
    }

    if (!itemId) return;
    const def = ITEM_DEFS[itemId];
    if (!def) return;

    this.heldItemMesh = createHeldItemMesh(itemId, 0.22);
    this.heldItemAnchor.add(this.heldItemMesh);
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  dispose(): void {
    this.scene.remove(this.group);
    if (this.heldItemMesh) {
      this.heldItemMesh.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
      });
    }
  }
}
