import { Group, MathUtils, Vector3 } from 'three';
import type { Object3D } from 'three';
import { RobotMotion } from '../animation/Motion';
import { GROUP, RAPIER } from '../physics/Physics';
import type { Physics, XYZ } from '../physics/Physics';
import { box, cylinder, glow, sign } from '../rendering/Primitives';

const start = new Vector3(3.05, 0, 0.35);
const route = [new Vector3(2.65, 0, -1.8), new Vector3(2.65, 0, -5.8), new Vector3(3.15, 0, -7)];
const rubber = '#253a43';
const shellColor = '#ebdfbf';
const safety = '#dc9a43';

export class Robot {
  private readonly root = new Group();
  private readonly body;
  private readonly motion: RobotMotion;
  private readonly position = start.clone();
  private readonly direction = new Vector3();
  private waypoint = 0;
  private wait = 2.8;
  private reaction = 0;
  private activity: 'idle' | 'patrol' | 'inspect' = 'idle';

  constructor(scene: Object3D, physics: Physics) {
    scene.add(this.root);
    this.body = physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    physics.world.createCollider(RAPIER.ColliderDesc.cuboid(0.54, 0.82, 0.34)
      .setTranslation(0, 0.82, 0).setCollisionGroups(GROUP.robot), this.body);

    const shell = new Group();
    const head = new Group();
    this.root.add(shell);
    shell.add(head);
    head.position.set(0, 1.67, 0.035);
    box(shell, [0.75, 0.28, 0.56], 0, 0.28, 0, rubber);
    box(shell, [0.74, 0.66, 0.49], 0, 0.82, 0, safety);
    box(shell, [0.66, 0.51, 0.09], 0, 0.83, 0.269, shellColor);
    box(shell, [0.41, 0.15, 0.035], 0, 0.94, 0.324, rubber);
    glow(shell, [0.11, 0.04, 0.015], 0.1, 0.95, 0.35, '#61eabe');
    sign(shell, 0.38, 0.105, 0, 0.73, 0.317, (ctx, w, h) => {
      ctx.fillStyle = '#eedbb3'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#20383e'; ctx.font = 'bold 102px monospace'; ctx.fillText('HR-01', 96, 109);
    });
    cylinder(shell, 0.12, 0.15, 0.28, 8, 0, 1.23, 0, rubber);

    for (const side of [-1, 1]) {
      const wheel = cylinder(this.root, 0.217, 0.217, 0.18, 12, side * 0.354, 0.219, 0, rubber);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(this.root, 0.119, 0.119, 0.18, 8, side * 0.382, 0.219, 0, '#719490');
      hub.rotation.z = Math.PI / 2;
      box(head, [0.098, 0.26, 0.36], side * 0.512, 0, 0, safety);
    }

    box(head, [1.01, 0.62, 0.53], 0, 0, 0, shellColor);
    box(head, [0.89, 0.53, 0.1], 0, 0.006, 0.285, rubber);
    glow(head, [0.78, 0.43, 0.026], 0, 0.012, 0.34, '#103e43');
    for (const side of [-1, 1]) {
      glow(head, [0.107, 0.123, 0.015], side * 0.162, 0.052, 0.357, '#89f9c6');
      glow(head, [0.05, 0.025, 0.015], side * 0.28, -0.052, 0.358, '#5dd6aa');
    }
    glow(head, [0.16, 0.027, 0.017], 0, -0.091, 0.358, '#89f9c6');
    box(head, [0.042, 0.23, 0.042], 0.28, 0.401, -0.05, rubber);
    const tip = cylinder(head, 0.068, 0.068, 0.076, 7, 0.28, 0.515, -0.05, safety);
    tip.rotation.z = 0.2;

    const arm = (side: number) => {
      const joint = new Group();
      joint.position.set(side * 0.43, 1.05, 0);
      joint.rotation.z = side * 0.11;
      shell.add(joint);
      box(joint, [0.2, 0.19, 0.24], 0, -0.055, 0, rubber);
      box(joint, [0.166, 0.38, 0.17], side * 0.055, -0.25, 0.026, shellColor);
      box(joint, [0.18, 0.16, 0.24], side * 0.08, -0.46, 0.085, rubber);
      box(joint, [0.17, 0.105, 0.19], side * 0.08, -0.535, 0.12, safety);
      return joint;
    };
    this.motion = new RobotMotion(shell, head, arm(1), arm(-1));
    this.reset();
  }

  reset(): void {
    this.position.copy(start);
    this.root.position.copy(start);
    this.root.rotation.y = -0.18;
    this.body.setTranslation(start, true);
    this.body.setNextKinematicTranslation(start);
    this.waypoint = 0;
    this.wait = 2.8;
    this.reaction = 0;
    this.activity = 'idle';
  }

  reactToThrow(player: XYZ): void {
    if (Math.hypot(player.x - this.position.x, player.z - this.position.z) < 4) this.reaction = 1;
  }

  step(dt: number, player: Vector3): void {
    this.reaction = Math.max(0, this.reaction - dt * 0.72);
    this.direction.set(player.x - this.position.x, 0, player.z - this.position.z);
    const distance = this.direction.length();
    if (distance < 2.15) {
      this.activity = 'inspect';
      this.turn(dt);
      return;
    }

    this.wait = Math.max(0, this.wait - dt);
    if (this.wait > 0) {
      this.activity = 'idle';
      return;
    }

    this.activity = 'patrol';
    this.direction.copy(route[this.waypoint]!).sub(this.position);
    if (this.direction.length() < 0.12) {
      this.waypoint = (this.waypoint + 1) % route.length;
      this.wait = 1.05;
      return;
    }
    this.turn(dt);
    this.position.addScaledVector(this.direction.normalize(), dt * 0.91);
    this.body.setNextKinematicTranslation(this.position);
    this.root.position.copy(this.position);
  }

  animate(time: number, menu: boolean): void {
    this.motion.update(time, this.activity, menu ? 0.58 + Math.sin(time * 1.6) * 0.25 : this.reaction);
  }

  private turn(dt: number): void {
    const target = Math.atan2(this.direction.x, this.direction.z);
    const diff = MathUtils.euclideanModulo(target - this.root.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    this.root.rotation.y += diff * Math.min(1, dt * 5);
    const half = this.root.rotation.y / 2;
    this.body.setNextKinematicRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
  }
}
