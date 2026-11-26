import { Vector3 } from 'three';
import { Loop } from './Loop';
import { Renderer } from '../rendering/Renderer';
import type { Physics } from '../physics/Physics';
import { Player } from '../player/Player';
import { Input } from '../player/Input';
import { Office, PLAYER_START, PRINTER_POSITION } from '../world/Office';
import { makeProps } from '../world/Props';
import { Interaction } from '../interaction/Interaction';
import { Robot } from '../npc/Robot';
import { Shift } from '../tasks/Shift';
import { OfficeEvents } from '../events/OfficeEvents';
import { Audio } from '../audio/Audio';
import type { Save } from '../save/Save';
import type { Platform } from '../platform/Platform';
import type { UI } from '../ui/UI';
import { loadOfficeBadge } from '../rendering/Assets';

export class Game {
  private readonly renderer: Renderer;
  private readonly player: Player;
  private readonly office: Office;
  private readonly robot: Robot;
  private readonly props;
  private readonly cartridge;
  private readonly interaction: Interaction;
  private readonly input: Input;
  private readonly shift = new Shift();
  private readonly events = new OfficeEvents();
  private readonly audio: Audio;
  private readonly marker = new Vector3();
  private readonly cameraPoint = new Vector3();
  private pointerLocked = false;
  private menuTime = 0;

  constructor(
    private readonly ui: UI,
    private readonly physics: Physics,
    private readonly platform: Platform,
    private readonly save: Save,
  ) {
    this.renderer = new Renderer(ui.canvas, platform.touch);
    const { scene, camera } = this.renderer;
    this.office = new Office(scene, physics);
    this.player = new Player(physics, camera, PLAYER_START);
    this.robot = new Robot(scene, physics);
    this.props = makeProps(scene, physics);
    this.cartridge = this.props.find((prop) => prop.id === 'cartridge')!;
    this.audio = new Audio(save.muted);
    this.interaction = new Interaction(physics, camera, this.player.collider,
      () => this.grabbed(), (thrown) => this.released(thrown));
    for (const prop of this.props) this.interaction.addProp(prop);
    this.interaction.addStation({
      collider: this.office.printerCollider,
      label: () => this.shift.phase === 'printing' ? '' : this.hasCartridge() ? 'Установить картридж' : 'Проверить PR-404',
      use: () => this.usePrinter(),
    });

    this.input = new Input(ui.canvas, ui.joystick, () => this.playing(), (action) => {
      if (action === 'pause') this.pause();
      else if (action === 'use') this.use();
      else this.drop(action === 'throw');
    }, platform.touch);

    ui.on('start', () => this.start());
    ui.on('restart', () => this.start());
    ui.on('menu', () => this.menu());
    ui.on('pause', () => this.pause());
    ui.on('resume', () => this.resume());
    ui.on('use', () => this.use());
    ui.on('throw', () => this.drop(true));
    ui.on('drop', () => this.drop(false));
    ui.on('jump', () => { if (this.playing()) this.input.jump(); });
    ui.on('mute', () => this.toggleAudio());
    ui.record(save.bestSeconds);
    ui.sound(save.muted);

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === ui.canvas;
      const lostLock = this.pointerLocked && !locked;
      this.pointerLocked = locked;
      if (lostLock) this.pause();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    ui.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.input.unlock();
      ui.error('Соединение с графическим процессором прервалось. Перезапустите офис.');
    });

    this.menu();
    new Loop().start(() => this.playing(), (dt) => this.step(dt), (dt) => this.render(dt));
    void loadOfficeBadge(scene).catch((error: unknown) => console.warn('Не удалось загрузить офисную эмблему.', error));
  }

  private playing(): boolean { return this.ui.screen === 'playing'; }
  private hasCartridge(): boolean { return this.interaction.held === this.cartridge; }

  private reset(): void {
    this.interaction.held = null;
    this.shift.reset();
    this.events.reset();
    this.input.clear();
    this.player.reset();
    this.robot.reset();
    this.office.setPrinted(false);
    this.renderer.lighting(1);
    this.ui.clearNotification();
    for (const prop of this.props) prop.reset();
    // Refresh the query pipeline after resetting all body positions.
    this.physics.step();
  }

  private menu(): void {
    this.reset();
    this.ui.show('menu');
    this.input.unlock();
  }

  private start(): void {
    this.reset();
    this.ui.show('playing');
    this.input.lock();
    this.ui.notify('PR-404 требует картридж. Служба ИИ перевела заявку на человека.', 4.5);
  }

  private pause(): void {
    if (!this.playing()) return;
    this.ui.show('pause');
    this.input.clear();
    this.input.unlock();
  }

  private resume(): void {
    if (this.ui.screen !== 'pause') return;
    this.input.clear();
    this.ui.show('playing');
    this.input.lock();
  }

  private use(): void {
    if (!this.playing() || this.shift.phase === 'printing') return;
    this.player.aim(this.input.takeLook());
    this.interaction.use();
  }

  private drop(thrown: boolean): void {
    if (!this.playing()) return;
    this.player.aim(this.input.takeLook());
    this.interaction.drop(thrown);
  }

  private grabbed(): void {
    this.audio.play('pick');
    this.platform.feedback('light');
    if (!this.hasCartridge()) return;
    this.shift.collected();
    this.ui.notify('Отнесите картридж к принтеру PR-404.');
  }

  private released(thrown: boolean): void {
    if (!thrown) return;
    this.audio.play('throw');
    this.platform.feedback('medium');
    this.robot.reactToThrow(this.player.body.translation());
  }

  private usePrinter(): void {
    if (!this.hasCartridge()) {
      this.ui.notify('PR-404 · Ошибка: нет картриджа. Решение: обратиться к человеку.');
      return;
    }
    this.interaction.consume();
    this.shift.print();
    this.audio.play('printer');
    this.platform.feedback('medium');
    this.ui.notify('Печатаем справку. Не выключайте человека.');
  }

  private toggleAudio(): void {
    const muted = !this.save.muted;
    this.save.setMuted(muted);
    this.audio.setMuted(muted);
    this.ui.sound(muted);
    if (!muted) this.audio.play('pick');
  }

  private step(dt: number): void {
    this.player.aim(this.input.takeLook());
    this.player.step(this.input, dt);
    this.robot.step(dt, this.renderer.camera.position);
    this.interaction.step();
    this.physics.step();
    this.player.syncCamera();
    if (this.player.body.translation().y < -3) {
      this.player.reset();
    }
    for (const prop of this.props) {
      if (prop.mesh.visible && prop.body.translation().y < -3) {
        if (this.interaction.held === prop) this.interaction.held = null;
        prop.reset();
      }
      prop.sync();
    }
    this.renderer.lighting(this.events.step(dt, (event) => {
      this.ui.notify(event.message, event.duration);
      this.audio.play('event');
    }));
    this.shift.step(dt);
    if (this.shift.phase === 'printing' || this.shift.phase === 'complete') {
      this.office.setPrinted(true, this.shift.printTime);
    }
    if (this.shift.phase === 'complete') {
      this.audio.play('win');
      const record = this.save.finish(this.shift.elapsed);
      this.ui.record(this.save.bestSeconds);
      this.ui.results(this.shift.elapsed, record);
      this.input.unlock();
    }
  }

  private render(dt: number): void {
    const { camera } = this.renderer;
    if (this.ui.screen === 'error') return;
    if (this.ui.screen === 'menu') {
      this.menuTime += dt;
      const portrait = camera.aspect < 0.85;
      camera.position.set(portrait ? 2.4 : 0, portrait ? 2.22 : 2.05, portrait ? 4.62 : 4.83);
      camera.position.x += Math.sin(this.menuTime * 0.46) * 0.11;
      camera.lookAt(portrait ? 2.75 : -0.13, portrait ? 2.26 : 1.62, portrait ? -3.2 : -4.4);
      this.robot.animate(this.menuTime, true);
    } else if (this.playing()) {
      this.player.aim(this.input.takeLook());
      this.robot.animate(this.shift.elapsed, false);
      this.ui.hud(this.shift.phase, this.hasCartridge(), this.interaction.label(), this.interaction.held?.label ?? '', this.shift.elapsed);
      this.updateMarker();
    }
    this.renderer.render();
  }

  private updateMarker(): void {
    if (this.shift.phase === 'printing') {
      this.ui.hideMarker();
      return;
    }
    const { camera } = this.renderer;
    const carrying = this.hasCartridge();
    const target = carrying ? PRINTER_POSITION : this.cartridge.mesh.position;
    camera.updateMatrixWorld();
    this.cameraPoint.copy(target).applyMatrix4(camera.matrixWorldInverse);
    if (this.cameraPoint.z >= -0.1 || camera.position.distanceTo(target) < 2.05) {
      this.ui.hideMarker();
      return;
    }
    this.marker.copy(target);
    this.marker.y += carrying ? 0.94 : 0.46;
    this.marker.project(camera);
    const x = (this.marker.x + 1) * 50;
    const y = (1 - this.marker.y) * 50;
    this.ui.mark(Math.max(10, Math.min(90, x)), Math.max(24, Math.min(68, y)), carrying ? 'PR-404' : 'КАРТРИДЖ');
  }
}
