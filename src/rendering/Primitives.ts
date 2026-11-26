import {
  BoxGeometry, CanvasTexture, CylinderGeometry, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PlaneGeometry, SRGBColorSpace,
} from 'three';
import type { Object3D } from 'three';
import type { BoxSize } from '../physics/Physics';

const cube = new BoxGeometry();
const plane = new PlaneGeometry();
const materials = new Map<string, MeshStandardMaterial>();

export function material(color: string): MeshStandardMaterial {
  let result = materials.get(color);
  if (!result) {
    result = new MeshStandardMaterial({ color, roughness: 0.78, flatShading: true });
    materials.set(color, result);
  }
  return result;
}

export function box(
  parent: Object3D, size: BoxSize, x: number, y: number, z: number,
  color: string, shadows = true,
): Mesh {
  const mesh = new Mesh(cube, material(color));
  mesh.scale.set(...size);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(
  parent: Object3D, top: number, bottom: number, height: number, segments: number,
  x: number, y: number, z: number, color: string,
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(top, bottom, height, segments), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function sign(
  parent: Object3D, width: number, height: number, x: number, y: number, z: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.max(64, Math.round(512 * height / width));
  const context = canvas.getContext('2d')!;
  draw(context, canvas.width, canvas.height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(plane, new MeshBasicMaterial({ map: texture, toneMapped: false }));
  mesh.scale.set(width, height, 1);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function glow(parent: Object3D, size: BoxSize, x: number, y: number, z: number, color: string): Mesh<BoxGeometry, MeshBasicMaterial> {
  const mesh = new Mesh(cube, new MeshBasicMaterial({ color, toneMapped: false }));
  mesh.scale.set(...size);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
