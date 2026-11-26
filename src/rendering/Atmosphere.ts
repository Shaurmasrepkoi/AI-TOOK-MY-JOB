import {
  BufferGeometry, CanvasTexture, Float32BufferAttribute, Mesh, MeshBasicMaterial,
  PlaneGeometry, Points, PointsMaterial,
} from 'three';
import type { Scene } from 'three';

export class Atmosphere {
  private readonly dust;
  private readonly contacts: Mesh[] = [];

  constructor(scene: Scene) {
    const origin: number[] = [];
    for (let i = 1; i <= 87; i++) {
      origin.push((i * 167 % 89) / 89 * 17 - 8.5, 0.7 + (i * 43 % 89) / 89 * 3.3, -9 + (i * 61 % 89) / 89 * 14);
    }
    const field = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(origin, 3));
    this.dust = new Points(field, new PointsMaterial({
      color: '#ffdba3', size: 0.036, transparent: true, opacity: 0.42, depthWrite: false,
    }));
    scene.add(this.dust);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const brush = context.createRadialGradient(32, 32, 4, 32, 32, 31);
    brush.addColorStop(0, 'rgba(13,32,35,0.40)');
    brush.addColorStop(0.58, 'rgba(13,32,35,0.21)');
    brush.addColorStop(1, 'rgba(13,32,35,0)');
    context.fillStyle = brush;
    context.fillRect(0, 0, 64, 64);
    const material = new MeshBasicMaterial({
      map: new CanvasTexture(canvas), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
    });
    const plane = new PlaneGeometry();
    for (const [x, z, width, length] of [
      [-0.45, -2.92, 3.5, 1.85], [-4.5, -6.47, 3.7, 1.84], [-4.5, -0.5, 3.16, 1.82],
      [0.15, -7.25, 3.48, 1.73], [4.65, -3.85, 2.02, 1.57], [-8.04, 3.53, 1.41, 4.4],
      [-5.7, 5.59, 2.42, 1.42], [7.25, -6.6, 2.61, 1.65],
    ] as const) {
      const shadow = new Mesh(plane, material);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, 0.021, z);
      shadow.scale.set(width, length, 1);
      this.contacts.push(shadow);
      scene.add(shadow);
    }
  }

  detail(enabled: boolean): void {
    this.dust.visible = enabled;
    for (const shadow of this.contacts) shadow.visible = enabled;
  }

  animate(time: number, power: number): void {
    this.dust.position.set(0.16 * Math.sin(time * 0.32), 0.11 * Math.cos(time * 0.38), 0.19 * Math.sin(time * 0.22));
    this.dust.material.opacity = 0.24 + power * 0.24;
  }
}
