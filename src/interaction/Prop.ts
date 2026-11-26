import { Group, Vector3 } from 'three';
import { GROUP } from '../physics/Physics';
import type { BoxSize, Physics } from '../physics/Physics';

export class Prop {
  readonly body;
  readonly collider;
  readonly spawn: Vector3;

  constructor(
    readonly id: string,
    readonly label: string,
    readonly mesh: Group,
    physics: Physics,
    size: BoxSize,
  ) {
    this.spawn = mesh.position.clone();
    ({ body: this.body, collider: this.collider } = physics.box(this.spawn, size, true));
  }

  carry(held: boolean): void {
    this.body.setGravityScale(held ? 0 : 1, true);
    this.collider.setCollisionGroups(held ? GROUP.held : GROUP.prop);
  }

  reset(): void {
    this.mesh.visible = true;
    this.body.setEnabled(true);
    this.carry(false);
    this.body.setTranslation(this.spawn, true);
    this.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.sync();
  }

  consume(): void {
    this.mesh.visible = false;
    this.body.setEnabled(false);
  }

  sync(): void {
    if (!this.mesh.visible) return;
    const p = this.body.translation();
    const q = this.body.rotation();
    this.mesh.position.set(p.x, p.y, p.z);
    this.mesh.quaternion.set(q.x, q.y, q.z, q.w);
  }
}
