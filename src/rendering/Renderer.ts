import {
  ACESFilmicToneMapping, Color, DirectionalLight, Fog, HemisphereLight, MathUtils,
  PCFShadowMap, PerspectiveCamera, Scene, Vector2, WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Atmosphere } from './Atmosphere';

export type Quality = 'low' | 'medium' | 'high';
const profiles = {
  low: { scale: 0.9, pixels: 650_000, shadow: 0 },
  medium: { scale: 1.25, pixels: 1_350_000, shadow: 1024 },
  high: { scale: 1.65, pixels: 2_600_000, shadow: 1536 },
} satisfies Record<Quality, { scale: number; pixels: number; shadow: number }>;

export class Renderer {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(64, 1, 0.05, 70);
  readonly gl: WebGLRenderer;
  private readonly sun: DirectionalLight;
  private readonly ambient: HemisphereLight;
  private readonly emergency: DirectionalLight;
  private readonly atmosphere: Atmosphere;
  private quality: Quality = 'medium';
  private effects?: { composer: EffectComposer; bloom: UnrealBloomPass; output: OutputPass };
  private power = 1;

  constructor(canvas: HTMLCanvasElement, quality: Quality) {
    this.gl = new WebGLRenderer({ canvas, antialias: quality !== 'low', alpha: false, powerPreference: 'high-performance' });
    this.gl.shadowMap.type = PCFShadowMap;
    this.gl.toneMapping = ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.05;
    this.scene.background = new Color('#abcfd8');
    this.scene.fog = new Fog('#adcbd3', 20, 48);
    this.ambient = new HemisphereLight('#d4eeff', '#9c806a', 2.06);
    this.sun = new DirectionalLight('#ffe0ac', 2.72);
    this.sun.position.set(-3.6, 6.7, -15);
    this.sun.target.position.set(1, 0.05, -1);
    this.sun.castShadow = true;
    Object.assign(this.sun.shadow.camera, { left: -11, right: 11, top: 10, bottom: -10, near: 0.5, far: 31 });
    this.sun.shadow.normalBias = 0.037;
    this.sun.shadow.bias = -0.00025;
    this.emergency = new DirectionalLight('#ff493b', 0);
    this.emergency.position.set(3.0, 4.7, 4.6);
    this.scene.add(this.ambient, this.sun, this.sun.target, this.emergency);
    this.atmosphere = new Atmosphere(this.scene);
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement!);
    this.setQuality(quality);
  }

  setQuality(quality: Quality): void {
    this.quality = quality;
    const { shadow } = profiles[quality];
    this.sun.castShadow = shadow > 0;
    this.gl.shadowMap.enabled = this.sun.castShadow;
    this.gl.shadowMap.needsUpdate = true;
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    if (shadow) this.sun.shadow.mapSize.setScalar(shadow);
    this.atmosphere.detail(quality !== 'low');
    if (quality === 'high' && !this.effects) {
      const composer = new EffectComposer(this.gl);
      const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.22, 0.47, 1.20);
      const output = new OutputPass();
      composer.addPass(new RenderPass(this.scene, this.camera));
      composer.addPass(bloom);
      composer.addPass(output);
      this.effects = { composer, bloom, output };
    } else if (quality !== 'high' && this.effects) {
      const { composer, bloom, output } = this.effects;
      bloom.dispose();
      output.dispose();
      composer.dispose();
      this.effects = undefined;
    }
    this.resize();
  }

  lighting(level: number, dt: number, time: number): number {
    this.power = dt > 0 ? MathUtils.damp(this.power, level, 10, dt) : level;
    this.sun.intensity = 2.72 * (0.43 + this.power * 0.57);
    this.ambient.intensity = 2.06 * (0.31 + this.power * 0.69);
    this.emergency.intensity = (1 - this.power) ** 1.4 * 1.42;
    this.atmosphere.animate(time, this.power);
    return this.power;
  }

  render(): void {
    if (this.effects) this.effects.composer.render();
    else this.gl.render(this.scene, this.camera);
  }

  private resize(): void {
    const host = this.gl.domElement.parentElement!;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const aspect = width / height;
    const { scale, pixels } = profiles[this.quality];
    const ratio = Math.min(devicePixelRatio, scale, Math.sqrt(pixels / (width * height)));
    this.gl.setPixelRatio(ratio);
    this.gl.setSize(width, height, false);
    if (this.effects) {
      this.effects.composer.setPixelRatio(ratio);
      this.effects.composer.setSize(width, height);
    }
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.85 ? 74 : 64;
    this.camera.updateProjectionMatrix();
  }
}
