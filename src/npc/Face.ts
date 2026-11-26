import { Color, MathUtils } from 'three';
import type { Group } from 'three';
import { glow } from '../rendering/Primitives';

export type Mood = 'neutral' | 'happy' | 'angry' | 'panic' | 'error' | 'sleep';

const faces = {
  neutral: { height: 0.12, tilt: 0, mouth: 0.15, opening: 0.027, smile: 0, color: '#90ffc9' },
  happy: { height: 0.078, tilt: -0.32, mouth: 0.18, opening: 0.048, smile: 0.25, color: '#a6ffd8' },
  angry: { height: 0.083, tilt: -0.34, mouth: 0.14, opening: 0.025, smile: -0.2, color: '#ff936d' },
  panic: { height: 0.167, tilt: 0.13, mouth: 0.069, opening: 0.08, smile: 0, color: '#ffe089' },
  error: { height: 0.069, tilt: 0, mouth: 0.20, opening: 0.023, smile: 0, color: '#ff706b' },
  sleep: { height: 0.015, tilt: 0, mouth: 0.055, opening: 0.025, smile: 0, color: '#79b0d0' },
} satisfies Record<Mood, { height: number; tilt: number; mouth: number; opening: number; smile: number; color: string }>;

export class Face {
  private readonly eyes;
  private readonly errors;
  private readonly mouth;
  private readonly corners;
  private readonly color = new Color();

  constructor(head: Group) {
    glow(head, [0.78, 0.43, 0.026], 0, 0.012, 0.34, '#103e43');
    this.eyes = [-1, 1].map(side => glow(head, [0.105, 0.12, 0.015], side * 0.162, 0.052, 0.357, '#89f9c6'));
    this.errors = [-1, 1].map(side => glow(head, [0.045, 0.132, 0.015], side * 0.162, 0.052, 0.36, '#ff706b'));
    this.mouth = glow(head, [0.16, 0.027, 0.017], 0, -0.091, 0.358, '#89f9c6');
    this.corners = [-1, 1].map(side => glow(head, [0.045, 0.025, 0.015], side * 0.087, -0.087, 0.358, '#89f9c6'));
  }

  update(mood: Mood, time: number, dt: number): void {
    const face = faces[mood];
    const blink = (time + 0.29) % 4.3;
    const blinkScale = 0.14 + 0.86 * Math.min(1, Math.abs(blink - 0.135) / 0.135);
    const glitch = mood === 'error' && Math.sin(time * 27) > 0.88;
    this.color.set(glitch ? '#b83f38' : face.color).multiplyScalar(1.65);
    const alpha = 1 - Math.exp(-18 * dt);
    this.eyes.forEach((eye, i) => {
      const side = i ? 1 : -1;
      const crossbar = this.errors[i]!;
      eye.scale.y = MathUtils.lerp(eye.scale.y, face.height * (mood === 'error' ? 1 : blinkScale), alpha);
      eye.rotation.z = MathUtils.lerp(eye.rotation.z, mood === 'error' ? 0.78 : face.tilt * side, alpha);
      eye.material.color.lerp(this.color, alpha);
      crossbar.rotation.z = -0.78;
      crossbar.visible = mood === 'error';
      crossbar.material.color.copy(this.color);
      const corner = this.corners[i]!;
      corner.material.color.copy(eye.material.color);
      corner.position.x = side * (this.mouth.scale.x * 0.5 + 0.005);
      corner.position.y = -0.091 + MathUtils.lerp(corner.position.y + 0.091, face.smile * 0.09, alpha);
      corner.rotation.z = face.smile * side * 2.3;
      corner.visible = Math.abs(face.smile) > 0;
    });
    this.mouth.scale.x = MathUtils.lerp(this.mouth.scale.x, face.mouth, alpha);
    this.mouth.scale.y = MathUtils.lerp(this.mouth.scale.y, face.opening * (mood === 'panic' ? 0.8 + Math.sin(time * 20) * 0.2 : 1), alpha);
    this.mouth.material.color.lerp(this.color, alpha);
  }
}
