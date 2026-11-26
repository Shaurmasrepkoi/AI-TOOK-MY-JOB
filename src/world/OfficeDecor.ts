import { Group, Vector3 } from 'three';
import { box, cylinder, glow, sign } from '../rendering/Primitives';
import { batchScenery } from '../rendering/StaticGeometry';
import type { BoxSize } from '../physics/Physics';

export const palette = {
  ink: '#263642', teal: '#287b73', cream: '#f1e4cb',
  gold: '#f6ad48', clay: '#be6855', sage: '#81a392',
};

type Solid = (size: BoxSize, x: number, y: number, z: number, color: string, shadows?: boolean) => unknown;

export function keyboard(group: Group, x: number, z: number): void {
  box(group, [0.46, 0.026, 0.176], x, 1.015, z, palette.ink);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      box(group, [0.037, 0.012, 0.03], x - 0.182 + col * 0.045, 1.031, z - 0.048 + row * 0.047, col === 8 ? palette.gold : palette.cream);
    }
  }
  const mouse = cylinder(group, 0.047, 0.06, 0.033, 8, x + 0.37, 1.017, z, palette.cream);
  mouse.scale.z = 1.42;
  box(group, [0.014, 0.009, 0.025], x + 0.37, 1.035, z - 0.028, palette.ink);
}

export function poster(group: Group, x: number, y: number, z: number, id: string, lines: string[], background: string, rotation = 0): void {
  const frame = new Group();
  frame.position.set(x, y, z);
  frame.rotation.y = rotation;
  group.add(frame);
  box(frame, [1.31, 1.65, 0.036], 0, 0, 0, palette.ink);
  sign(frame, 1.24, 1.58, 0, 0, 0.02, (ctx, w, h) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f9ebcc'; ctx.fillRect(39, 48, 434, 2);
    ctx.font = 'bold 26px monospace'; ctx.fillText('AUTO DIVISION   /   ' + id, 39, 92);
    ctx.strokeStyle = '#fbc16a'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(108, 209, 53, 0.2, 5.8); ctx.stroke();
    ctx.fillStyle = '#fbc16a'; ctx.fillRect(107, 192, 112, 16);
    ctx.fillStyle = '#fff0d6'; ctx.font = '900 57px Arial';
    lines.forEach((line, i) => ctx.fillText(line, 39, 339 + i * 62, 434));
    ctx.fillRect(39, h - 63, 434, 2);
  });
}

export function furnishOffice(decor: Group, solid: Solid): Group {
  const { ink, teal, gold, cream, clay, sage } = palette;
  // Entry and lounge share a continuous dado and a separate warm floor inset.
  box(decor, [0.05, 0.91, 16.55], -8.84, 0.45, -1.5, teal, false);
  box(decor, [0.07, 0.12, 16.58], -8.8, 0.065, -1.5, ink, false);
  box(decor, [0.05, 0.91, 16.55], 8.84, 0.45, -1.5, ink, false);
  box(decor, [17.65, 0.89, 0.06], 0, 0.445, 6.84, teal, false);
  box(decor, [5.4, 0.014, 4.75], -5.93, 0.012, 3.34, '#b98265', false);
  box(decor, [5.2, 0.015, 0.055], -5.93, 0.018, 1.11, cream, false);
  for (const x of [-8.50, -3.36]) box(decor, [0.05, 0.016, 4.43], x, 0.019, 3.34, cream, false);
  for (const z of [2.53, 4.47]) {
    solid([0.9, 0.52, 1.45], -8.01, 0.31, z, teal);
    solid([0.19, 0.57, 1.48], -8.39, 0.72, z, teal);
    box(decor, [0.63, 0.125, 1.25], -7.94, 0.61, z, sage);
    for (const end of [-1, 1]) box(decor, [0.64, 0.16, 0.16], -7.97, 0.72, z + end * 0.63, teal);
  }
  solid([0.83, 0.16, 1.22], -6.6, 0.47, 3.45, cream);
  for (const z of [3.07, 3.83]) box(decor, [0.57, 0.4, 0.095], -6.6, 0.2, z, ink);
  const magazine = box(decor, [0.31, 0.025, 0.45], -6.62, 0.57, 3.52, gold);
  magazine.rotation.y = 0.19;
  box(decor, [0.15, 0.16, 0.025], -6.73, 0.63, 3.22, clay).rotation.x = -0.32;

  // Open bookcase, with a real volume so carried props cannot pass through it.
  const shelf = new Group();
  shelf.position.set(-8.36, 0, -3.1);
  shelf.rotation.y = Math.PI / 2;
  decor.add(shelf);
  for (const x of [-1.04, 1.04]) box(shelf, [0.12, 2.67, 0.51], x, 1.34, 0, ink);
  for (const y of [0.21, 0.91, 1.61, 2.31, 2.68]) box(shelf, [2.11, 0.12, 0.51], 0, y, 0, ink);
  box(shelf, [2.12, 2.67, 0.09], 0, 1.34, -0.22, teal);
  for (let i = 0; i < 9; i++) {
    box(shelf, [0.13, 0.38 + (i % 4) * 0.055, 0.28], -0.82 + i * 0.187, 1.18 + (i % 4) * 0.028, 0, [gold, cream, clay, sage][i % 4]!);
  }
  for (const x of [-0.62, 0.23, 0.71]) {
    box(shelf, [0.41, 0.28, 0.35], x, 1.82, 0, cream);
    box(shelf, [0.14, 0.04, 0.009], x, 1.84, 0.179, clay);
  }

  // Two server racks sit behind the east partition, with a separate service entrance.
  for (const x of [5.64, 6.89]) {
    solid([1.03, 2.26, 0.65], x, 1.13, -9.25, ink);
    box(decor, [0.86, 2.07, 0.05], x, 1.14, -8.907, '#182a36');
    for (let i = 0; i < 8; i++) {
      box(decor, [0.67, 0.14, 0.035], x, 0.33 + i * 0.235, -8.868, '#476272');
      glow(decor, [0.09, 0.035, 0.01], x + 0.229, 0.33 + i * 0.235, -8.842, i % 3 ? '#6cfac1' : '#ffc46e');
    }
  }
  box(decor, [4.24, 0.013, 1.57], 6.69, 0.012, -9.14, '#587b80', false);

  poster(decor, -8.79, 2.43, 4.59, '01', ['AI First.', 'Humans', 'Optional.'], '#245750', Math.PI / 2);
  poster(decor, -8.79, 2.48, 2.73, '02', ['Happiness', 'requires a Premium', 'subscription.'], '#884634', Math.PI / 2);
  poster(decor, 8.79, 2.48, -4.63, '03', ['Your salary is', 'an optimization', 'problem.'], '#884634', -Math.PI / 2);
  poster(decor, 8.79, 2.48, -2.96, '04', ['No bugs.', 'Only unexpected', 'features.'], '#2e5960', -Math.PI / 2);
  poster(decor, -1.11, 2.47, 6.78, '05', ['Human activity', 'detected.'], '#315d65', Math.PI);

  const clock = new Group();
  clock.position.copy(new Vector3(8.78, 3.38, -0.9));
  clock.rotation.y = -Math.PI / 2;
  decor.add(clock);
  const rim = cylinder(clock, 0.34, 0.34, 0.09, 20, 0, 0, 0, ink);
  rim.rotation.x = Math.PI / 2;
  const face = cylinder(clock, 0.295, 0.295, 0.03, 20, 0, 0, 0.05, cream);
  face.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const tick = box(clock, [0.018, 0.045, 0.012], Math.sin(angle) * 0.248, Math.cos(angle) * 0.248, 0.068, ink, false);
    tick.rotation.z = -angle;
  }
  const hour = box(clock, [0.034, 0.15, 0.018], -0.056, 0.031, 0.076, ink, false);
  hour.rotation.z = 1.06;
  const hand = new Group();
  hand.position.z = 0.088;
  box(hand, [0.019, 0.24, 0.016], 0, 0.105, 0, clay, false);
  clock.add(hand);
  batchScenery(shelf, clock);
  return hand;
}
