import { Color, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { BufferGeometry, Group } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Keep spatial culling and the original shadow flags when combining opaque scenery.
export function batchScenery(...groups: Group[]): void {
  const chunks = new Map<string, { group: Group; meshes: Mesh[]; shadow: boolean }>();
  for (const group of groups) {
    for (const child of group.children) {
      if (!(child instanceof Mesh) || !(child.material instanceof MeshStandardMaterial)) continue;
      const { x, z } = child.position;
      const key = [groups.indexOf(group), Math.floor(x / 6), Math.floor(z / 6), child.castShadow].join('/');
      const chunk = chunks.get(key) ?? { group, meshes: [], shadow: child.castShadow };
      chunk.meshes.push(child);
      chunks.set(key, chunk);
    }
  }
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.78, flatShading: true });
  const color = new Color();
  const center = new Vector3();
  for (const { group, meshes, shadow } of chunks.values()) {
    if (meshes.length < 2) continue;
    const pieces: BufferGeometry[] = [];
    for (const mesh of meshes) {
      mesh.updateMatrix();
      const part = mesh.geometry.clone().applyMatrix4(mesh.matrix);
      color.copy((mesh.material as MeshStandardMaterial).color);
      const colors = new Float32Array(part.getAttribute('position').count * 3);
      for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
      part.setAttribute('color', new Float32BufferAttribute(colors, 3));
      pieces.push(part);
    }
    const geometry = mergeGeometries(pieces)!;
    geometry.computeBoundingBox();
    geometry.boundingBox!.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    const batch = new Mesh(geometry, material);
    batch.position.copy(center);
    batch.castShadow = shadow;
    batch.receiveShadow = true;
    group.add(batch);
    group.remove(...meshes);
    for (const part of pieces) part.dispose();
  }
}
