import {
  ACESFilmicToneMapping, Color, DirectionalLight, Fog, HemisphereLight,
  PCFShadowMap, PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';

export class Renderer {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(64, 1, 0.05, 70);
  readonly gl: WebGLRenderer;
  private readonly sun: DirectionalLight;
  private readonly ambient: HemisphereLight;

  constructor(canvas: HTMLCanvasElement, readonly lowQuality: boolean) {
    const context = canvas.getContext('webgl2', { antialias: !lowQuality, alpha: false });
    if (!context) throw new Error('Для этой игры нужен WebGL 2.');
    this.gl = new WebGLRenderer({ canvas, context, antialias: !lowQuality, powerPreference: 'high-performance' });
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = PCFShadowMap;
    this.gl.toneMapping = ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.26;
    this.scene.background = new Color('#a6c9d3');
    this.scene.fog = new Fog('#adced4', 23, 53);

    this.ambient = new HemisphereLight('#c4e5ff', '#98946d', 2.25);
    this.sun = new DirectionalLight('#fff2d0', 3.15);
    this.sun.position.set(2, 8, 4);
    this.sun.target.position.set(0, 0, -3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.setScalar(lowQuality ? 768 : 1536);
    Object.assign(this.sun.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 0.5, far: 30 });
    this.sun.shadow.normalBias = 0.028;
    this.sun.shadow.bias = -0.00022;
    this.scene.add(this.ambient, this.sun, this.sun.target);

    new ResizeObserver(() => this.resize()).observe(canvas.parentElement!);
    this.resize();
  }

  lighting(level: number): void {
    this.sun.intensity = 3.15 * level;
    this.ambient.intensity = 2.25 * (0.52 + 0.48 * level);
  }

  render(): void {
    this.gl.render(this.scene, this.camera);
  }

  private resize(): void {
    const host = this.gl.domElement.parentElement!;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const aspect = width / height;
    const pixelBudget = Math.sqrt((this.lowQuality ? 900_000 : 2_900_000) / (width * height));
    this.gl.setPixelRatio(Math.min(devicePixelRatio, this.lowQuality ? 1.2 : 1.65, pixelBudget));
    this.gl.setSize(width, height, false);
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.85 ? 74 : 64;
    this.camera.updateProjectionMatrix();
  }
}
