import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { Collider } from '@dimforge/rapier3d-compat';
import { RAPIER } from '../physics/Physics';
import type { Physics } from '../physics/Physics';
import type { Prop } from './Prop';

export interface Station {
  collider: Collider;
  label: () => string;
  use: () => void;
}

export class Interaction {
  private readonly direction = new Vector3();
  private readonly target = new Vector3();
  private readonly options = new Map<number, Prop | Station>();
  private readonly aim = new Vector3();
  held: Prop | null = null;

  constructor(
    private readonly physics: Physics,
    private readonly camera: Camera,
    private readonly player: Collider,
    private readonly grab: () => void,
    private readonly release: (thrown: boolean) => void,
  ) {}

  addProp(prop: Prop): void { this.options.set(prop.collider.handle, prop); }
  addStation(station: Station): void { this.options.set(station.collider.handle, station); }

  focus(): Prop | Station | undefined {
    this.camera.getWorldDirection(this.direction);
    const ray = new RAPIER.Ray(this.camera.position, this.direction);
    const hit = this.physics.world.castRay(
      ray, 2.85, true, undefined, undefined, this.player, undefined,
      (collider) => collider.handle !== this.held?.collider.handle,
    );
    return hit ? this.options.get(hit.collider.handle) : undefined;
  }

  label(): string {
    const focus = this.focus();
    if (!focus) return '';
    if ('use' in focus) return focus.label();
    return this.held ? '' : `Взять · ${focus.label}`;
  }

  use(): void {
    const focus = this.focus();
    if (!focus) return;
    if ('use' in focus) {
      focus.use();
    } else if (!this.held) {
      this.held = focus;
      focus.carry(true);
      this.grab();
    }
  }

  drop(thrown = false): void {
    if (!this.held) return;
    const { body } = this.held;
    this.held.carry(false);
    this.held = null;
    this.camera.getWorldDirection(this.direction);
    body.setLinvel(thrown ? this.direction.multiplyScalar(8.8).add({ x: 0, y: 0.65, z: 0 }) : { x: 0, y: 0, z: 0 }, true);
    body.setAngvel(thrown ? { x: 3.8, y: 4.9, z: 2.2 } : { x: 0, y: 0, z: 0 }, true);
    this.release(thrown);
  }

  consume(): void {
    this.held?.consume();
    this.held = null;
  }

  step(): void {
    if (!this.held) return;
    this.camera.getWorldDirection(this.direction);
    this.target.copy(this.camera.position).addScaledVector(this.direction, 1.12);
    this.aim.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.target.addScaledVector(this.aim, 0.31);
    this.target.y -= 0.24;

    const position = this.held.body.translation();
    this.target.sub(position).multiplyScalar(16).clampLength(0, 8);
    this.held.body.setLinvel(this.target, true);
    this.held.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
}
