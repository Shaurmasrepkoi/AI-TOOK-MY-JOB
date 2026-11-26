import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Scene } from 'three';
import badgeUrl from '../world/office-badge.glb?url';

export async function loadOfficeBadge(scene: Scene): Promise<void> {
  const asset = await new GLTFLoader().loadAsync(badgeUrl);
  asset.scene.position.set(5.27, 1.83, -3.95);
  asset.scene.rotation.y = -0.13;
  scene.add(asset.scene);
}
