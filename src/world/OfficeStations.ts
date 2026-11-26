import { Group, MathUtils, Vector3 } from 'three';
import type { Object3D } from 'three';
import { box, cylinder, glow, sign } from '../rendering/Primitives';
import { RAPIER, GROUP } from '../physics/Physics';
import type { Physics, XYZ } from '../physics/Physics';
import { palette } from './OfficeDecor';
import { batchScenery } from '../rendering/StaticGeometry';

const { ink, cream, teal, gold, clay } = palette;
export const COFFEE_POSITION = new Vector3(-5.7, 1.45, 5.59);
export const FILTER_POSITION = new Vector3(-3.52, 1.15, -0.48);

function tag(parent: Object3D, width: number, height: number, x: number, y: number, z: number, text: string, accent = '#ffcf83'): void {
  sign(parent, width, height, x, y, z, (ctx, w, h) => {
    ctx.fillStyle = '#172c35'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.font = `bold ${Math.round(h * 0.54)}px monospace`;
    ctx.fillText(text, 23, h * 0.69, w - 46);
  });
}

export class OfficeStations {
  readonly doorCollider;
  readonly coffeeCollider;
  readonly vendingCollider;
  readonly terminalCollider;
  readonly switchCollider;

  private readonly door = new Group();
  private readonly doorBody;
  private readonly doorPoint = new Vector3(7.65, 0, -8.12);
  private readonly status;
  private readonly coffeeButton;
  private readonly coffeeStream;
  private readonly cup;
  private readonly coffeeLevel;
  private readonly vendingButton;
  private readonly vendingSnack;
  private readonly terminalPages;
  private readonly switchLever;
  private readonly switchLamp;
  private angle = 0;
  private opened = false;
  private vendTime = 0;
  private page = 0;
  lightsOn = true;

  constructor(scene: Object3D, physics: Physics) {
    const furniture = new Group();
    scene.add(furniture, this.door);
    this.door.position.copy(this.doorPoint);
    this.doorBody = physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(this.doorPoint.x, this.doorPoint.y, this.doorPoint.z));
    this.doorCollider = physics.world.createCollider(RAPIER.ColliderDesc.cuboid(0.53, 1.04, 0.063)
      .setTranslation(0.53, 1.04, 0).setCollisionGroups(GROUP.solid), this.doorBody);
    box(this.door, [1.06, 2.08, 0.126], 0.53, 1.04, 0, '#315f65');
    box(this.door, [0.83, 0.87, 0.016], 0.53, 1.43, 0.067, '#497d83');
    box(this.door, [0.8, 0.87, 0.016], 0.53, 1.43, -0.067, '#497d83');
    for (const z of [-0.101, 0.101]) {
      box(this.door, [0.2, 0.065, 0.08], 0.88, 0.98, z, gold);
    }
    tag(this.door, 0.8, 0.23, 0.53, 1.54, 0.078, 'SERVER / 03');
    for (const x of [7.6, 8.77]) {
      box(furniture, [0.095, 2.27, 0.17], x, 1.135, -8.12, ink);
      physics.box({ x, y: 1.135, z: -8.12 }, [0.095, 2.27, 0.17]);
    }
    box(furniture, [1.23, 0.14, 0.19], 8.18, 2.2, -8.12, ink);
    physics.box({ x: 8.18, y: 2.2, z: -8.12 }, [1.23, 0.14, 0.19]);

    const coffee = new Group();
    coffee.position.set(COFFEE_POSITION.x, 0.98, COFFEE_POSITION.z);
    coffee.rotation.y = Math.PI;
    scene.add(coffee);
    box(coffee, [1.85, 0.98, 0.78], 0, -0.49, 0, teal);
    box(coffee, [1.9, 0.085, 0.83], 0, -0.012, 0, cream);
    physics.box({ x: coffee.position.x, y: 0.49, z: coffee.position.z }, [1.9, 0.98, 0.83]);
    this.coffeeCollider = physics.box(COFFEE_POSITION, [0.95, 0.89, 0.57]).collider;
    box(coffee, [0.94, 0.91, 0.53], 0, 0.49, 0, ink);
    box(coffee, [0.54, 0.42, 0.023], -0.09, 0.34, 0.269, '#13252d');
    box(coffee, [0.56, 0.055, 0.22], -0.09, 0.12, 0.311, '#405761');
    box(coffee, [0.45, 0.07, 0.18], -0.09, 0.52, 0.352, '#405761');
    tag(coffee, 0.83, 0.21, 0, 0.79, 0.271, 'BREW-OPS');
    this.coffeeButton = box(coffee, [0.115, 0.087, 0.065], 0.347, 0.41, 0.283, gold);
    this.status = glow(coffee, [0.084, 0.04, 0.014], 0.346, 0.53, 0.278, '#ff7662');
    this.cup = cylinder(coffee, 0.079, 0.053, 0.11, 10, -0.09, 0.22, 0.378, cream);
    this.coffeeLevel = cylinder(coffee, 0.065, 0.065, 0.005, 10, -0.09, 0.276, 0.378, '#53392e');
    this.coffeeStream = glow(coffee, [0.018, 0.22, 0.018], -0.09, 0.384, 0.377, '#9c5e40');
    const coffeeSign = new Group();
    coffeeSign.position.set(0, 1.32, 0.22);
    coffee.add(coffeeSign);
    tag(coffeeSign, 1.49, 0.29, 0, 0, 0, '02 / BREAK ROOM');

    const vending = new Group();
    vending.position.set(-3.46, 0, 5.65);
    vending.rotation.y = Math.PI;
    scene.add(vending);
    this.vendingCollider = physics.box({ x: -3.46, y: 0.99, z: 5.65 }, [0.93, 1.98, 0.64]).collider;
    box(vending, [0.93, 1.98, 0.64], 0, 0.99, 0, clay);
    tag(vending, 0.81, 0.22, 0, 1.8, 0.323, 'SNACK / AI');
    box(vending, [0.68, 0.98, 0.025], -0.055, 1.13, 0.332, '#263f48');
    for (let row = 0; row < 3; row++) {
      box(vending, [0.63, 0.036, 0.025], -0.055, 0.84 + 0.32 * row, 0.355, ink);
      for (let col = 0; col < 4; col++) {
        box(vending, [0.09, 0.17, 0.024], -0.285 + 0.15 * col, 0.95 + 0.32 * row, 0.355, [gold, teal, cream, '#b678a3'][(col + row) % 4]!);
      }
    }
    box(vending, [0.54, 0.17, 0.045], -0.08, 0.37, 0.338, ink);
    this.vendingButton = box(vending, [0.081, 0.1, 0.055], 0.35, 0.77, 0.345, gold);
    this.vendingSnack = box(vending, [0.13, 0.09, 0.059], -0.1, 0.54, 0.369, gold);

    this.terminalCollider = physics.box({ x: -4.55, y: 1.39, z: -0.67 }, [0.74, 0.46, 0.1]).collider;
    this.terminalPages = ['IN SYNC', 'KPI: 0 HUMANS', 'BUILD GREEN*', '*VIBES ONLY'].map((caption) => {
      const panel = new Group();
      furniture.add(panel);
      tag(panel, 0.66, 0.37, -4.55, 1.39, -0.618, caption, '#8ff1c0');
      return panel;
    });

    const switchPanel = new Group();
    scene.add(switchPanel);
    switchPanel.position.set(5.94, 0, 3.12);
    this.switchCollider = physics.box({ x: 5.94, y: 1.53, z: 3.15 }, [0.43, 0.61, 0.33]).collider;
    physics.box({ x: 5.94, y: 0.67, z: 3.12 }, [0.16, 1.29, 0.16]);
    box(switchPanel, [0.41, 0.13, 0.39], 0, 0.065, 0, ink);
    box(switchPanel, [0.13, 1.38, 0.12], 0, 0.75, 0, ink);
    box(switchPanel, [0.43, 0.61, 0.27], 0, 1.53, 0, cream);
    box(switchPanel, [0.25, 0.3, 0.032], 0, 1.55, 0.151, ink);
    this.switchLever = box(switchPanel, [0.13, 0.17, 0.08], 0, 1.55, 0.182, gold);
    this.switchLamp = glow(switchPanel, [0.11, 0.035, 0.017], 0, 1.75, 0.142, '#92ffba');
    tag(switchPanel, 0.33, 0.08, 0, 1.3, 0.141, 'ЛИНИЯ A');

    const movingCoffee = new Group();
    movingCoffee.add(this.cup, this.coffeeLevel, this.coffeeStream, this.coffeeButton);
    coffee.add(movingCoffee);
    const movingVending = new Group();
    movingVending.add(this.vendingSnack, this.vendingButton);
    vending.add(movingVending);
    const movingSwitch = new Group();
    movingSwitch.add(this.switchLever);
    switchPanel.add(movingSwitch);
    batchScenery(furniture, this.door, coffee, vending, switchPanel);
    this.reset();
  }

  get doorOpen(): boolean { return this.opened; }
  get vendingBusy(): boolean { return this.vendTime > 0 && this.vendTime < 0.6; }

  toggleDoor(player: XYZ): boolean {
    if (this.opened && this.nearSweep(player)) return false;
    this.opened = !this.opened;
    return true;
  }

  dispense(): void { this.vendTime = 0.001; }

  nextTerminalPage(): string {
    this.page = (this.page + 1) % this.terminalPages.length;
    this.updateTerminal();
    return [
      'Терминал · Все системы работают. Опрос систем проводили сами системы.',
      'Дашборд · Цель «0 сотрудников» выполнена на 99%.',
      'CI · Сборка зелёная. Тесты заменены уверенностью.',
      'Вайбкодинг · Коммит «вроде работает» принят советом директоров.',
    ][this.page]!;
  }

  reset(): void {
    this.angle = this.vendTime = this.page = 0;
    this.opened = false;
    this.lightsOn = true;
    this.doorBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    this.doorBody.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
    this.door.rotation.y = 0;
    this.switchLever.rotation.x = -0.32;
    this.updateTerminal();
    this.animate(0, null, false, 0);
  }

  stepDoor(dt: number, player: XYZ): void {
    const target = this.opened ? -Math.PI * 0.5 : 0;
    // Stall a closing door whenever the capsule enters the swept doorway.
    const blocked = !this.opened && this.angle < -0.02 && this.nearSweep(player);
    if (!blocked && Math.abs(target - this.angle) > 0.001) {
      this.angle = MathUtils.damp(this.angle, target, 8, dt);
      const half = this.angle * 0.5;
      this.doorBody.setNextKinematicRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
    }
  }

  syncDoor(): void {
    const q = this.doorBody.rotation();
    this.door.quaternion.set(q.x, q.y, q.z, q.w);
  }

  animate(dt: number, brew: number | null, fixed: boolean, time: number): void {
    if (this.vendTime > 0) this.vendTime = Math.min(1, this.vendTime + dt);
    this.vendingButton.position.z = 0.345 - 0.032 * Math.sin(Math.PI * Math.min(1, this.vendTime / 0.32));
    this.vendingSnack.visible = this.vendTime > 0.23;
    this.vendingSnack.position.y = 0.35 + 0.34 * (1 - MathUtils.smoothstep(this.vendTime, 0.23, 0.7));
    this.vendingSnack.rotation.z = (1 - MathUtils.smoothstep(this.vendTime, 0.23, 0.7)) * 1.6;

    this.cup.visible = fixed;
    this.coffeeStream.visible = brew !== null && brew > 0.16 && brew < 0.92;
    this.coffeeStream.scale.x = 0.014 + 0.005 * Math.sin(time * 59);
    this.coffeeLevel.visible = brew !== null && brew > 0.2;
    this.coffeeLevel.position.y = 0.17 + 0.097 * (brew ?? 0);
    this.coffeeButton.position.z = 0.283 - 0.035 * Math.sin(Math.PI * Math.min(1, (brew ?? 0) * 10));
    this.status.material.color.set(fixed ? '#94ffc5' : '#ff7662');
    this.switchLever.rotation.x = MathUtils.damp(this.switchLever.rotation.x, this.lightsOn ? -0.32 : 0.38, 20, dt);
    this.switchLamp.material.color.set(this.lightsOn ? '#92ffba' : '#ff715c');
  }

  private nearSweep(player: XYZ): boolean {
    const dx = player.x - this.doorPoint.x;
    const dz = player.z - this.doorPoint.z;
    return dx > -0.34 && dz > -0.36 && Math.hypot(dx, dz) < 1.38;
  }

  private updateTerminal(): void {
    this.terminalPages.forEach((panel, i) => { panel.visible = i === this.page; });
  }
}
