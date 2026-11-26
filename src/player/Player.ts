import { MathUtils, PerspectiveCamera } from 'three';
import { GROUP, RAPIER } from '../physics/Physics';
import type { Physics, XYZ } from '../physics/Physics';
import type { Input } from './Input';

export class Player {
  readonly body;
  readonly collider;
  private readonly controller;
  stride = 0;
  private vertical = 0;
  private yaw = 0;
  private pitch = 0;
  private grounded = false;

  constructor(
    physics: Physics,
    private readonly camera: PerspectiveCamera,
    private readonly spawn: XYZ,
  ) {
    this.body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(this.spawn.x, this.spawn.y, this.spawn.z),
    );
    this.collider = physics.world.createCollider(
      RAPIER.ColliderDesc.capsule(0.54, 0.31).setCollisionGroups(GROUP.player), this.body,
    );
    this.controller = physics.world.createCharacterController(0.022);
    this.controller.enableSnapToGround(0.18);
    this.controller.setApplyImpulsesToDynamicBodies(true);
    this.controller.setCharacterMass(55);
  }

  reset(): void {
    this.vertical = this.stride = 0;
    this.yaw = 0;
    this.pitch = -0.015;
    this.grounded = false;
    this.body.setTranslation(this.spawn, true);
    this.body.setNextKinematicTranslation(this.spawn);
    this.syncCamera();
  }

  aim(delta: { x: number; y: number }): void {
    this.yaw -= delta.x * 0.00265;
    this.pitch = MathUtils.clamp(this.pitch - delta.y * 0.00265, -1.43, 1.43);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  step(input: Input, dt: number): void {
    const { x, z } = input.movement();
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    if (input.takeJump() && this.grounded) this.vertical = 4.55;
    this.vertical = Math.max(this.vertical - 12.8 * dt, -16);
    const speed = 4.25 * dt;
    this.controller.computeColliderMovement(this.collider, {
      x: (x * cos + z * sin) * speed,
      y: this.vertical * dt,
      z: (z * cos - x * sin) * speed,
    }, undefined, GROUP.player);
    const corrected = this.controller.computedMovement();
    this.grounded = this.controller.computedGrounded();
    this.stride = this.grounded ? Math.hypot(corrected.x, corrected.z) : 0;
    if (this.grounded && this.vertical < 0) this.vertical = -0.45;
    if (this.vertical > 0 && corrected.y < this.vertical * dt * 0.25) this.vertical = 0;
    const position = this.body.translation();
    this.body.setNextKinematicTranslation({ x: position.x + corrected.x, y: position.y + corrected.y, z: position.z + corrected.z });
  }

  syncCamera(): void {
    const position = this.body.translation();
    this.camera.position.set(position.x, position.y + 0.72, position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
