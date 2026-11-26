import { Group, MathUtils, Vector3 } from 'three';
import type { Object3D } from 'three';
import { RobotMotion } from '../animation/Motion';
import { GROUP, RAPIER } from '../physics/Physics';
import type { Physics, XYZ } from '../physics/Physics';
import { box, cylinder, glow, sign } from '../rendering/Primitives';
import { Face } from './Face';
import type { Mood } from './Face';
import type { RobotPhase } from '../tasks/Shift';

const start = new Vector3(3.05, 0, 0.35);
const route = [new Vector3(2.65, 0, -1.8), new Vector3(2.65, 0, -5.8), new Vector3(3.15, 0, -7)];
const rubber = '#253a43';
const shellColor = '#ebdfbf';
const safety = '#dc9a43';

export class Robot {
  private readonly root = new Group();
  private readonly body;
  readonly collider;
  private readonly controller;
  private readonly face: Face;
  private readonly wheels: Group[] = [];
  private readonly velocity = new Vector3();
  private yaw = -0.18;
  private wheelAngle = 0;
  private stuckFor = 0;
  private response: Mood = 'neutral';
  private service: RobotPhase = 'patrol';
  moving = false;
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
    this.collider = physics.world.createCollider(RAPIER.ColliderDesc.cuboid(0.54, 0.99, 0.34)
      .setTranslation(0, 0.99, 0).setCollisionGroups(GROUP.robot), this.body);
    this.controller = physics.world.createCharacterController(0.025);

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
      const axle = new Group();
      axle.position.set(side * 0.38, 0.219, 0);
      this.wheels.push(axle);
      this.root.add(axle);
      const wheel = cylinder(axle, 0.217, 0.217, 0.18, 12, -side * 0.021, 0, 0, rubber);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(axle, 0.119, 0.119, 0.2, 8, 0, 0, 0, '#719490');
      hub.rotation.z = Math.PI / 2;
      box(axle, [0.014, 0.15, 0.033], side * 0.105, 0, 0, shellColor);
      box(head, [0.098, 0.26, 0.36], side * 0.512, 0, 0, safety);
    }

    box(head, [1.01, 0.62, 0.53], 0, 0, 0, shellColor);
    box(head, [0.89, 0.53, 0.1], 0, 0.006, 0.285, rubber);
    this.face = new Face(head);
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

  get location(): Vector3 { return this.position; }

  reset(): void {
    this.position.copy(start);
    this.yaw = -0.18;
    this.body.setTranslation(start, true);
    this.body.setNextKinematicTranslation(start);
    const q = { x: 0, y: Math.sin(this.yaw / 2), z: 0, w: Math.cos(this.yaw / 2) };
    this.body.setRotation(q, true);
    this.body.setNextKinematicRotation(q);
    this.sync();
    this.waypoint = this.wheelAngle = this.reaction = this.stuckFor = 0;
    this.wait = 2.8;
    this.activity = 'idle';
    this.service = 'patrol';
    this.moving = false;
  }

  react(mood: Mood, seconds: number): void {
    this.response = mood;
    this.reaction = seconds;
  }

  reactToThrow(player: XYZ): void {
    if (Math.hypot(player.x - this.position.x, player.z - this.position.z) < 4) this.react('panic', 1.5);
  }

  step(dt: number, player: Vector3, service: RobotPhase): void {
    this.service = service;
    this.moving = false;
    this.reaction = Math.max(0, this.reaction - dt);
    this.direction.set(player.x - this.position.x, 0, player.z - this.position.z);
    const distance = this.direction.length();
    if (distance < 2.15) {
      this.activity = 'inspect';
      this.turn(dt);
      return;
    }
    this.activity = 'idle';
    if (service === 'stuck' || service === 'rebooting') return;

    this.wait = Math.max(0, this.wait - dt);
    if (this.wait > 0) return;
    this.direction.copy(route[this.waypoint]!).sub(this.position);
    if (this.direction.lengthSq() < 0.0144) {
      this.nextWaypoint();
      return;
    }

    this.activity = 'patrol';
    const alignment = this.turn(dt);
    this.velocity.copy(this.direction).setLength(dt * 0.91 * Math.max(0.12, alignment));
    this.controller.computeColliderMovement(this.collider, this.velocity, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, GROUP.robot);
    const movement = this.controller.computedMovement();
    const length = Math.hypot(movement.x, movement.z);
    this.moving = length > dt * 0.09;
    if (!this.moving) {
      this.stuckFor += dt;
      if (this.stuckFor > 0.65) {
        this.react('angry', 1.25);
        this.nextWaypoint();
      }
      return;
    }
    this.stuckFor = 0;
    this.wheelAngle -= length / 0.217;
    this.body.setNextKinematicTranslation({ x: this.position.x + movement.x, y: 0, z: this.position.z + movement.z });
  }

  sync(): void {
    const position = this.body.translation();
    this.position.set(position.x, position.y, position.z);
    this.root.position.copy(this.position);
    const q = this.body.rotation();
    this.root.quaternion.set(q.x, q.y, q.z, q.w);
  }

  animate(time: number, dt: number, menu: boolean): void {
    let mood: Mood = this.activity === 'inspect' ? 'happy' : 'neutral';
    if (this.activity === 'idle' && time % 17 > 14) mood = 'sleep';
    if (this.service === 'stuck') mood = 'error';
    if (this.service === 'rebooting') mood = 'sleep';
    if (this.reaction > 0) mood = this.response;
    if (menu) mood = time % 9 > 4 ? 'happy' : 'neutral';
    this.face.update(mood, time, dt);
    const wave = menu ? 0.66 + Math.sin(time * 1.6) * 0.23 : Math.min(1, this.reaction) * (mood === 'happy' || mood === 'panic' ? 1 : 0.25);
    this.motion.update(time, this.activity, wave);
    for (const wheel of this.wheels) wheel.rotation.x = this.wheelAngle;
  }

  private nextWaypoint(): void {
    this.waypoint = (this.waypoint + 1) % route.length;
    this.wait = 1.05;
    this.stuckFor = 0;
  }

  private turn(dt: number): number {
    const target = Math.atan2(this.direction.x, this.direction.z);
    const diff = MathUtils.euclideanModulo(target - this.yaw + Math.PI, Math.PI * 2) - Math.PI;
    this.yaw += diff * Math.min(1, dt * 5);
    const half = this.yaw / 2;
    this.body.setNextKinematicRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
    return Math.cos(diff);
  }
}
