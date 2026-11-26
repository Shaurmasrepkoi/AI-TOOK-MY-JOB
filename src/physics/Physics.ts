import RAPIER from '@dimforge/rapier3d-compat';
import type { Collider, RigidBody } from '@dimforge/rapier3d-compat';
import { FIXED_STEP } from '../core/Loop';

export type XYZ = { x: number; y: number; z: number };
export type BoxSize = readonly [number, number, number];

export const GROUP = {
  solid: 0x0001001f,
  player: 0x0002000d,
  prop: 0x0004001f,
  robot: 0x00080017,
  held: 0x0010000d,
};

export class Physics {
  readonly world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  constructor() {
    this.world.timestep = FIXED_STEP;
  }

  static async create(): Promise<Physics> {
    await RAPIER.init();
    return new Physics();
  }

  box(position: XYZ, size: BoxSize, dynamic = false): { body: RigidBody; collider: Collider } {
    const desc = dynamic
      ? RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true).setLinearDamping(0.12).setAngularDamping(0.35)
      : RAPIER.RigidBodyDesc.fixed();
    const body = this.world.createRigidBody(desc.setTranslation(position.x, position.y, position.z));
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
        .setFriction(0.75).setRestitution(dynamic ? 0.35 : 0.1)
        .setCollisionGroups(dynamic ? GROUP.prop : GROUP.solid),
      body,
    );
    return { body, collider };
  }

  step(): void {
    this.world.step();
  }
}

export { RAPIER };
