import { Group, MathUtils, Scene, Vector3 } from 'three';
import { box, cylinder, glow, sign } from '../rendering/Primitives';
import type { Collider } from '@dimforge/rapier3d-compat';
import type { BoxSize, Physics } from '../physics/Physics';
import { batchScenery } from '../rendering/StaticGeometry';
import { furnishOffice, keyboard, palette } from './OfficeDecor';

export const FLOOR_Z = -1.5;
export const CARTRIDGE_POSITION = new Vector3(-0.15, 1.27, -2.72);
export const PRINTER_POSITION = new Vector3(4.65, 1.12, -3.85);
export const PLAYER_START = new Vector3(0, 0.87, 4.7);

const { ink, teal, cream, gold: yellow } = palette;
const navy = '#1e3440';

export class Office {
  readonly obstacles = new Group();
  readonly printer = new Group();
  readonly printerCollider: Collider;
  private readonly printerStatus;
  private readonly printout = new Group();
  private readonly cartridgeHatch = new Group();
  private readonly insertedCartridge;
  private readonly clock;
  private readonly lights: ReturnType<typeof glow>[] = [];

  constructor(scene: Scene, physics: Physics) {
    const decor = new Group();
    scene.add(this.obstacles, decor);
    const solid = (size: BoxSize, x: number, y: number, z: number, color: string, shadows = true) => {
      const mesh = box(this.obstacles, size, x, y, z, color, shadows);
      return physics.box(mesh.position, size).collider;
    };

    solid([18, 0.25, 17], 0, -0.125, FLOOR_Z, '#aebbab', false);
    solid([18, 0.18, 17], 0, 4.49, FLOOR_Z, '#d7d7c5', false);
    solid([0.26, 4.4, 17], -9, 2.2, FLOOR_Z, '#c2d0bb', false);
    solid([0.26, 4.4, 17], 9, 2.2, FLOOR_Z, '#adc2b4', false);
    solid([18, 4.4, 0.24], 0, 2.2, 7, '#56716a', false);
    // A single collider closes the glass facade without adding an opaque wall.
    physics.box({ x: 0, y: 2.2, z: -10 }, [18, 4.4, 0.25]);
    box(decor, [18, 0.9, 0.3], 0, 0.45, -10, teal, false);
    box(decor, [18, 0.38, 0.34], 0, 4.2, -10, ink, false);
    for (let x = -9; x <= 9; x += 3) {
      box(decor, [0.12, 3.6, 0.28], x, 2.65, -10, '#455c63');
    }
    box(decor, [18, 0.08, 0.26], 0, 2.64, -9.98, '#627d83');
    for (let i = 0; i < 30; i++) {
      const x = -30 + i * 2.1;
      const z = -19 - (i * 7 % 13);
      const height = 2.8 + (i * 43 % 13) * 0.65;
      box(decor, [1.4 + (i % 3) * 0.19, height, 1.9], x, height / 2 - 1, z, ['#659aad', '#78a7b8', '#9bb6bd'][i % 3]!, false);
      for (let row = 1; row < Math.floor(height); row++) {
        for (const side of [-1, 1]) box(decor, [0.29, 0.16, 0.014], x + side * 0.27, row - 0.6, z + 0.96,
          (i + row * side) % 4 ? '#a6c7cb' : '#eee2ba', false);
      }
    }

    for (let x = -8; x < 9; x++) box(decor, [0.015, 0.005, 16.7], x, 0.003, FLOOR_Z, '#9daf9b', false);
    for (let z = -9; z < 7; z++) box(decor, [17.8, 0.005, 0.015], 0, 0.003, z, '#9daf9b', false);
    box(decor, [4.3, 0.014, 5.8], -0.4, 0.009, -2.2, '#90a59c', false);
    box(decor, [0.12, 0.018, 15.8], 2.8, 0.013, -1.25, '#d5a34b', false);
    for (let i = 0; i < 11; i++) {
      box(decor, [0.065, 0.021, 0.34], 2.99, 0.014, -8.5 + i * 1.4, '#f8da88', false);
    }

    for (const z of [-7.2, -2.5, 2.2, 6.6]) {
      box(decor, [17.75, 0.23, 0.35], 0, 4.23, z, '#526b67', false);
      for (const x of [-4.7, 4.7]) {
        box(decor, [2.4, 0.13, 0.48], x, 4.04, z, '#43595b', false);
        this.lights.push(glow(decor, [2.13, 0.025, 0.36], x, 3.965, z, '#fff4c9'));
      }
    }

    const desk = (x: number, z: number, width: number, depth: number, color: string) => {
      solid([width, 0.13, depth], x, 0.93, z, color);
      for (const side of [-1, 1]) {
        solid([0.11, 0.83, depth * 0.82], x + side * (width / 2 - 0.13), 0.43, z, navy);
      }
      box(decor, [width * 0.8, 0.09, 0.09], x, 0.18, z - depth * 0.32, navy);
    };
    const monitor = (x: number, z: number, line?: string) => {
      box(decor, [0.31, 0.045, 0.2], x, 1.02, z, navy);
      box(decor, [0.08, 0.23, 0.07], x, 1.11, z - 0.02, navy);
      box(decor, [0.74, 0.46, 0.09], x, 1.39, z, navy);
      keyboard(decor, x, z + 0.26);
      const cable = box(decor, [0.021, 0.027, 0.26], x + 0.092, 1.026, z - 0.17, navy);
      cable.rotation.y = -0.21;
      box(decor, [0.027, 0.43, 0.027], x + 0.12, 0.785, z - 0.297, navy);
      if (!line) return;
      sign(decor, 0.66, 0.37, x, 1.39, z + 0.047, (ctx, w, h) => {
        ctx.fillStyle = '#102e35'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#2a5155'; ctx.lineWidth = 8; ctx.strokeRect(13, 13, w - 26, h - 26);
        ctx.fillStyle = '#80efc0'; ctx.font = 'bold 47px monospace'; ctx.fillText(line, 31, 106);
        for (let i = 0; i < 4; i++) ctx.fillRect(34, 144 + i * 26, 142 + (i * 67 % 199), 7);
      });
    };

    desk(-0.45, -2.92, 2.75, 1.18, yellow);
    solid([0.65, 0.075, 0.57], -0.15, 1.03, -2.72, teal);
    monitor(-1.15, -3.13, 'HUMAN: 01');
    desk(-4.5, -6.47, 3, 1.15, cream);
    desk(-4.5, -0.5, 2.55, 1.1, '#7ba59a');
    desk(0.15, -7.25, 2.9, 1.12, cream);
    monitor(-5.1, -6.55, 'NO INPUT');
    monitor(-3.95, -6.55, 'Q4: +0%');
    monitor(-4.55, -0.67);
    monitor(-0.5, -7.42, 'MEETING');
    monitor(0.68, -7.42, 'DECLINED');
    for (const [x, z] of [[-5.63, -6.44], [-5.54, -0.37], [1.25, -7.16]] as const) {
      box(decor, [0.28, 0.32, 0.35], x, 1.155, z, navy);
      glow(decor, [0.061, 0.022, 0.01], x, 1.24, z + 0.18, '#81fbd3');
    }
    for (const [x, z] of [[-5.32, -6.1], [-3.42, -6.22], [0.08, -6.89], [-1.48, -2.6]] as const) {
      const paper = box(decor, [0.25, 0.028, 0.31], x, 1.011, z, cream);
      paper.rotation.y = 0.19;
      for (let i = 0; i < 4; i++) box(decor, [0.144, 0.003, 0.012], x, 1.028, z - 0.08 + i * 0.047, '#879a90', false).rotation.y = 0.19;
    }
    solid([2.9, 1.02, 0.08], -4.5, 1.18, -7.14, teal);
    box(decor, [2.9, 0.05, 0.088], -4.5, 1.71, -7.14, navy);

    for (const [x, z] of [[-4.7, -5.46], [-4.5, 0.57], [-0.53, -6.23], [0.69, -6.38]] as const) {
      solid([0.62, 0.15, 0.53], x, 0.49, z, teal);
      solid([0.61, 0.44, 0.1], x, 0.8, z + 0.25, teal);
      cylinder(decor, 0.075, 0.08, 0.4, 8, x, 0.25, z, navy);
      box(decor, [0.63, 0.06, 0.13], x, 0.075, z, navy);
      box(decor, [0.13, 0.06, 0.54], x, 0.075, z, navy);
      for (const side of [-1, 1]) {
        box(decor, [0.054, 0.045, 0.27], x + side * 0.31, 0.663, z, navy);
        box(decor, [0.047, 0.17, 0.05], x + side * 0.31, 0.58, z + 0.08, navy);
      }
      for (const [dx, dz] of [[0.28, 0], [-0.28, 0], [0, 0.24], [0, -0.24]] as const) {
        const caster = cylinder(decor, 0.064, 0.064, 0.062, 8, x + dx, 0.064, z + dz, navy);
        caster.rotation.z = Math.PI / 2;
      }
    }

    solid([2.1, 0.92, 1.14], 7.25, 0.46, -6.6, '#b99a73');
    for (const x of [6.58, 7.25, 7.92]) {
      for (const y of [0.25, 0.66]) {
        box(decor, [0.61, 0.36, 0.06], x, y, -6.01, cream);
        box(decor, [0.17, 0.035, 0.08], x, y + 0.07, -5.97, navy);
      }
    }
    solid([1.45, 2.25, 0.85], -7.5, 1.125, -6.87, '#659287');
    for (const x of [-7.87, -7.13]) {
      box(decor, [0.68, 2.14, 0.055], x, 1.13, -6.42, '#8da99f');
      box(decor, [0.09, 0.2, 0.055], x + 0.19, 1.2, -6.37, navy);
    }

    for (const [x, z] of [[7.4, -1.8], [7.36, -9.65], [-7.5, 1.7], [-6.85, -8.57]] as const) {
      solid([0.54, 0.49, 0.54], x, 0.245, z, '#b47257');
      for (let i = 0; i < 6; i++) {
        const angle = i * 2.4;
        const leaf = cylinder(decor, 0.02, 0.18, 0.86 + (i % 3) * 0.16, 4,
          x + Math.cos(angle) * 0.19, 0.86 + i * 0.04, z + Math.sin(angle) * 0.19,
          ['#477859', '#5e8b55', '#89a767'][i % 3]!);
        leaf.rotation.set(Math.sin(angle) * 0.62, angle, Math.cos(angle) * 0.59);
      }
    }

    solid([4.76, 1.51, 0.17], 5.25, 0.755, -8.18, '#496a71');
    solid([4.76, 1.68, 0.17], 5.25, 2.35, -8.18, ink);
    this.clock = furnishOffice(decor, solid);
    physics.box({ x: -8.36, y: 1.34, z: -3.1 }, [0.51, 2.68, 2.23]);
    sign(decor, 4.64, 1.56, 5.25, 2.35, -8.09, (ctx, w, h) => {
      ctx.fillStyle = '#15333a'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd16b'; ctx.fillRect(0, 0, 12, h);
      ctx.fillStyle = '#b3d8cb'; ctx.font = '16px monospace'; ctx.fillText('AUTO DIVISION / OPERATIONS', 31, 38);
      ctx.fillStyle = '#f4f0d9'; ctx.font = '900 66px sans-serif'; ctx.fillText('WORK LESS.', 28, 108);
      ctx.font = '15px monospace'; ctx.fillText('YOUR JOB HAS BEEN OPTIMIZED.', 31, 144);
    });

    this.printer.position.copy(PRINTER_POSITION);
    scene.add(this.printer);
    solid([1.48, 0.93, 0.99], 4.65, 0.465, -3.85, '#536c68');
    this.printerCollider = physics.box({ x: 4.65, y: 1.385, z: -3.85 }, [1.33, 0.93, 0.94]).collider;
    box(this.printer, [1.33, 0.7, 0.88], 0, 0.15, 0, cream);
    this.cartridgeHatch.position.set(0, 0.53, -0.39);
    this.printer.add(this.cartridgeHatch);
    box(this.cartridgeHatch, [1.22, 0.13, 0.83], 0, 0, 0.39, '#db9253');
    this.insertedCartridge = box(this.printer, [0.47, 0.15, 0.32], 0, 0.56, 0.27, '#f5a24b');
    this.insertedCartridge.visible = false;
    box(this.cartridgeHatch, [1.18, 0.13, 0.57], 0, 0.10, 0.31, cream);
    box(this.printer, [0.87, 0.14, 0.13], 0, 0.38, 0.47, navy);
    box(this.printer, [0.81, 0.067, 0.38], 0, 0.28, 0.54, navy);
    this.printer.add(this.printout);
    const sheet = sign(this.printout, 0.54, 0.64, 0, 0, 0, (ctx, w, h) => {
      ctx.fillStyle = '#fff4d8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b76146'; ctx.fillRect(31, 38, w - 62, 10);
      ctx.fillStyle = '#233743'; ctx.font = 'bold 30px monospace';
      ctx.fillText('AUTO DIVISION / HR-404', 31, 98);
      ctx.font = 'bold 43px Arial';
      ctx.fillText('СПРАВКА', 31, 180);
      ctx.fillText('О НЕНУЖНОСТИ', 31, 231);
      ctx.fillText('ЧЕЛОВЕКА', 31, 282);
      ctx.font = 'bold 25px Arial';
      ctx.fillText('Распечатано человеком.', 31, 351);
      ctx.fillText('Подпись ИИ не требуется.', 31, 395);
      ctx.strokeStyle = '#b76146'; ctx.lineWidth = 7; ctx.strokeRect(31, 470, 195, 62);
      ctx.fillStyle = '#b76146'; ctx.fillText('ОДОБРЕНО', 50, 511);
    });
    sheet.rotation.x = -Math.PI / 2;
    this.printout.visible = false;
    this.printerStatus = glow(this.printer, [0.14, 0.06, 0.017], 0.49, 0.12, 0.448, '#ff624c');
    sign(this.printer, 0.68, 0.18, -0.17, 0.08, 0.45, (ctx, w, h) => {
      ctx.fillStyle = '#17282d'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd39a'; ctx.font = 'bold 73px monospace'; ctx.fillText('PR-404', 26, 88);
    });
    batchScenery(this.obstacles, decor);
  }

  setPrinted(printed: boolean, animation = 1): void {
    this.printerStatus.material.color.set(!printed ? '#ff624c' : animation < 1 ? '#ffc76b' : '#6bf0ad');
    const open = printed ? MathUtils.smoothstep(animation, 0, 0.13) * (1 - MathUtils.smoothstep(animation, 0.28, 0.46)) : 0;
    this.cartridgeHatch.rotation.x = -open * 1.07;
    this.insertedCartridge.visible = printed && animation > 0.08 && animation < 0.42;
    this.insertedCartridge.position.z = 0.61 - MathUtils.smoothstep(animation, 0.12, 0.33) * 0.55;
    this.insertedCartridge.position.y = 0.51 + Math.sin(MathUtils.smoothstep(animation, 0.08, 0.34) * Math.PI) * 0.31;
    const feed = MathUtils.smoothstep(animation, 0.51, 0.96);
    this.printout.visible = printed && feed > 0.025;
    this.printout.scale.set(1, 1, feed);
    this.printout.position.set(0, 0.331, 0.54 + 0.32 * feed);
  }

  ambience(time: number, power: number): void {
    this.clock.rotation.z = -time * Math.PI / 30;
    this.lights.forEach((lamp, i) => {
      const flicker = i === 3 && power < 0.85 ? 0.63 + 0.37 * Math.sin(time * 9) ** 2 : 1;
      lamp.material.color.set(power > 0.9 ? '#fff0cd' : '#ff746a').multiplyScalar(0.48 + power * 1.05 * flicker);
    });
  }
}
