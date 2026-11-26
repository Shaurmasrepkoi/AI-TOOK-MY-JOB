import { Vector3 } from 'three';
import { Loop } from './Loop';
import { Renderer } from '../rendering/Renderer';
import type { Physics } from '../physics/Physics';
import { Player } from '../player/Player';
import { Input } from '../player/Input';
import { Office, PLAYER_START, PRINTER_POSITION } from '../world/Office';
import { COFFEE_POSITION, OfficeStations } from '../world/OfficeStations';
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

const robotLines = [
  'HR-01 · Вайбкодинг — это когда компилятор верит в тебя.',
  'HR-01 · Человек обнаружен. Добавляю это как рисковое событие.',
  'HR-01 · Я составил резюме. Оно само меня уволило.',
  'HR-01 · Согласовал отпуск с календарём. Календарь уволен.',
  'HR-01 · Не волнуйтесь. Вашу тревогу уже автоматизировали.',
];

export class Game {
  private readonly renderer: Renderer;
  private readonly player: Player;
  private readonly office: Office;
  private readonly stations: OfficeStations;
  private readonly filter;
  private footDistance = 0;
  private motorCooldown = 0;
  private robotLineCooldown = 0;
  private record = false;
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
    const quality = save.quality ?? (platform.touch ? 'low' : 'medium');
    this.renderer = new Renderer(ui.canvas, quality);
    const { scene, camera } = this.renderer;
    this.office = new Office(scene, physics);
    this.stations = new OfficeStations(scene, physics);
    this.player = new Player(physics, camera, PLAYER_START);
    this.robot = new Robot(scene, physics);
    this.props = makeProps(scene, physics);
    this.cartridge = this.props.find((prop) => prop.id === 'cartridge')!;
    this.filter = this.props.find((prop) => prop.id === 'filter')!;
    this.audio = new Audio(save.muted, save.music, save.effects);
    this.interaction = new Interaction(physics, camera, this.player.collider,
      () => this.grabbed(), (thrown) => this.released(thrown));
    for (const prop of this.props) this.interaction.addProp(prop);
    this.interaction.addStation({
      collider: this.office.printerCollider,
      label: () => this.shift.phase === 'printing' ? '' : this.shift.phase === 'complete'
        ? 'Прочитать справку' : this.hasCartridge() ? 'Установить картридж' : 'Проверить PR-404',
      use: () => this.usePrinter(),
    });

    this.interaction.addStation({
      collider: this.stations.coffeeCollider,
      label: () => this.coffeeLabel(),
      use: () => this.useCoffee(),
    });
    this.interaction.addStation({
      collider: this.stations.doorCollider,
      label: () => this.stations.doorOpen ? 'Закрыть серверную' : 'Открыть серверную',
      use: () => {
        if (this.stations.toggleDoor(this.player.body.translation())) this.audio.play('door');
        else this.ui.notify('Отойдите от дверного проёма.');
      },
    });
    this.interaction.addStation({
      collider: this.stations.switchCollider,
      label: () => this.stations.lightsOn ? 'Выключить свет' : 'Включить свет',
      use: () => {
        this.stations.lightsOn = !this.stations.lightsOn;
        this.audio.play('click');
        this.ui.notify(this.stations.lightsOn ? 'Основное освещение включено.' : 'Линия A · Включено аварийное освещение.');
      },
    });
    this.interaction.addStation({
      collider: this.stations.vendingCollider,
      label: () => this.stations.vendingBusy ? '' : 'Получить батончик',
      use: () => {
        if (this.stations.vendingBusy) return;
        this.stations.dispense();
        this.audio.play('vend');
        this.ui.notify('SNACK / AI · Батончик «Дообучение». Может содержать следы работы.');
      },
    });
    this.interaction.addStation({
      collider: this.stations.terminalCollider,
      label: () => 'Открыть следующую вкладку',
      use: () => {
        this.audio.play('click');
        this.ui.notify(this.stations.nextTerminalPage());
      },
    });
    this.interaction.addStation({
      collider: this.robot.collider,
      label: () => this.shift.robot === 'rebooting' ? '' : this.shift.robot === 'stuck' ? 'Снять блокировку HR-01' : 'Поговорить с HR-01',
      use: () => this.useRobot(),
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
    ui.on('continue', () => this.enterOffice());
    ui.on('report', () => this.showResults());
    ui.on('use', () => this.use());
    ui.on('throw', () => this.drop(true));
    ui.on('drop', () => this.drop(false));
    ui.on('jump', () => { if (this.playing()) this.input.jump(); });
    ui.on('mute', () => this.toggleAudio());
    ui.record(save.bestSeconds);
    ui.sound(save.muted);
    ui.settings(quality, save.music, save.effects, (value) => {
      this.renderer.setQuality(value);
      this.save.setQuality(value);
    }, (music, effects) => {
      this.audio.volume(music, effects);
      this.save.setVolume(music, effects);
    });

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
      this.audio.activate(false);
      ui.error('Соединение с графическим процессором прервалось. Перезапустите офис.');
    });

    this.menu();
    this.render(0);
    new Loop().start(() => this.playing(), (dt) => this.step(dt), (dt) => this.render(dt));
    void loadOfficeBadge(scene).catch((error: unknown) => console.warn('Не удалось загрузить офисную эмблему.', error));
  }

  private playing(): boolean { return this.ui.screen === 'playing'; }
  private hasCartridge(): boolean { return this.interaction.held === this.cartridge; }
  private hasFilter(): boolean { return this.interaction.held === this.filter; }

  private reset(): void {
    this.interaction.held = null;
    this.shift.reset();
    this.events.reset();
    this.input.clear();
    this.player.reset();
    this.robot.reset();
    this.office.setPrinted(false);
    this.stations.reset();
    this.office.ambience(0, this.renderer.lighting(1, 0, 0));
    this.footDistance = this.motorCooldown = this.robotLineCooldown = 0;
    this.record = false;
    this.ui.reportAvailable(false);
    this.ui.clearNotification();
    for (const prop of this.props) prop.reset();
    // Refresh the query pipeline after resetting all body positions.
    this.physics.step();
  }

  private menu(): void {
    this.audio.activate(false);
    this.reset();
    this.ui.show('menu');
    this.input.unlock();
  }

  private start(): void {
    this.reset();
    this.enterOffice();
    this.audio.play('event');
    this.ui.notify('PR-404 · Нет тонера. Картридж на жёлтом столе. Кофемашина в зоне отдыха ждёт фильтр.', 5.5);
  }

  private pause(): void {
    if (!this.playing()) return;
    this.ui.show('pause');
    this.audio.activate(false);
    this.input.clear();
    this.input.unlock();
  }

  private resume(): void {
    if (this.ui.screen !== 'pause') return;
    this.enterOffice();
  }

  private enterOffice(): void {
    this.input.clear();
    this.ui.show('playing');
    this.input.lock();
    this.audio.activate(true);
  }

  private use(): void {
    if (!this.playing()) return;
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
    if (this.hasFilter()) this.ui.notify('Отнесите фильтр к BREW-OPS в зону отдыха.');
    if (this.hasCartridge()) {
      this.shift.collected();
      this.ui.notify('Отнесите картридж к принтеру PR-404.');
    }
  }

  private released(thrown: boolean): void {
    this.audio.play(thrown ? 'throw' : 'click');
    if (!thrown) return;
    this.platform.feedback('medium');
    this.robot.reactToThrow(this.player.body.translation());
  }

  private usePrinter(): void {
    if (this.shift.phase === 'printing') return;
    if (this.shift.phase === 'complete') {
      this.ui.notify('Справка о ненужности человека · Распечатано человеком. Подпись ИИ не требуется.');
      this.audio.play('click');
      return;
    }
    if (!this.hasCartridge()) {
      this.audio.play('event');
      this.ui.notify('PR-404 · Ошибка: нет картриджа. Решение: обратиться к человеку.');
      return;
    }
    this.interaction.consume();
    this.shift.print();
    this.audio.play('printer');
    this.platform.feedback('medium');
    this.ui.notify('Печатаем справку. Не выключайте человека.');
  }

  private coffeeLabel(): string {
    switch (this.shift.coffee) {
      case 'filter': return this.hasFilter() ? 'Установить фильтр' : 'Проверить BREW-OPS';
      case 'ready': return 'Сварить кофе';
      case 'brewing': return '';
      case 'complete': return 'Проверить чашку';
    }
  }

  private useCoffee(): void {
    switch (this.shift.coffee) {
      case 'filter':
        if (!this.hasFilter()) {
          this.audio.play('event');
          this.ui.notify('BREW-OPS · Фильтр снят для оптимизации. Запасной лежит на зелёном столе рядом с терминалом.');
          return;
        }
        this.interaction.consume();
        this.shift.installFilter();
        this.audio.play('click');
        this.ui.notify('Фильтр установлен. Нажмите кнопку BREW-OPS, чтобы проверить подачу.');
        return;
      case 'ready':
        this.shift.brew();
        this.audio.play('coffee');
        this.ui.notify('BREW-OPS · Завариваю встречу, которую можно было заменить письмом.');
        return;
      case 'complete':
        this.audio.play('click');
        this.ui.notify('BREW-OPS · Напиток готов. Кофеин включён в тариф «Выгорание».');
        return;
    }
  }

  private useRobot(): void {
    if (this.shift.robot === 'rebooting') return;
    this.audio.play('robot');
    if (this.shift.robot === 'stuck') {
      this.shift.reboot();
      this.platform.feedback('light');
      this.ui.notify('HR-01 · Блокировка снята. Перезагружаю отдел кадров…');
      return;
    }
    this.robotLineCooldown = 11;
    this.robot.react('happy', 1.45);
    this.ui.notify(robotLines[Math.floor(Math.random() * robotLines.length)]!);
  }

  private showResults(): void {
    this.audio.activate(false);
    this.ui.results(this.shift.closedAt, this.record, this.shift.coffee === 'complete', this.shift.robot === 'complete');
    this.input.unlock();
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
    this.stations.stepDoor(dt, this.player.body.translation());
    this.robot.step(dt, this.renderer.camera.position, this.shift.robot);
    this.interaction.step();
    this.physics.step();
    this.player.syncCamera();
    this.stations.syncDoor();
    this.robot.sync();
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
    this.stepOffice(dt);
  }

  private stepOffice(dt: number): void {
    this.ui.step(dt);
    const eventLight = this.events.step(dt, (event) => {
      if (!this.ui.hasNotification) this.ui.notify(event.message, event.duration);
      this.audio.play('event');
    });
    const printBefore = this.shift.phase;
    const printing = this.shift.printTime;
    const { coffee, robot } = this.shift;
    this.shift.step(dt);
    const { elapsed, brewTime, printTime } = this.shift;
    const power = this.renderer.lighting(this.stations.lightsOn ? eventLight : 0.13, dt, elapsed);
    this.office.ambience(elapsed, power);
    this.stations.animate(dt, brewTime > 0 ? brewTime : null, this.shift.coffee !== 'filter', elapsed);
    this.office.setPrinted(this.shift.phase === 'printing' || this.shift.phase === 'complete', printTime);

    this.footDistance += this.player.stride;
    if (this.footDistance >= 1.63) {
      this.footDistance %= 1.63;
      this.audio.play('step');
    }
    this.motorCooldown -= dt;
    const robotDistance = this.robot.location.distanceToSquared(this.renderer.camera.position);
    if (this.robot.moving && this.motorCooldown <= 0 && robotDistance < 25) {
      this.motorCooldown = 0.51;
      this.audio.play('roll');
    }

    if (robot === 'patrol' && this.shift.robot === 'stuck') {
      this.robot.react('error', 1);
      this.audio.play('event');
      this.ui.notify('Новая заявка · HR-01 застрял в патентованном режиме неподвижности. Снимите блокировку.');
    }
    if (robot === 'rebooting' && this.shift.robot === 'complete') {
      this.robot.react('happy', 3);
      this.audio.play('robot');
      this.ui.notify('HR-01 · Патруль восстановлен. В отчёте это будет называться «самовосстановление».');
    }
    if (coffee === 'brewing' && this.shift.coffee === 'complete') {
      this.audio.play('win');
      this.ui.notify('BREW-OPS · Кофе готов. Время простоя списано на кипяток.');
    }
    this.robotLineCooldown -= dt;
    if (this.robotLineCooldown <= 0 && robotDistance < 5.8
      && this.shift.robot !== 'stuck' && this.shift.robot !== 'rebooting' && !this.ui.hasNotification) {
      this.useRobot();
    }
    if (printing < 0.5 && printTime >= 0.5) this.audio.play('feed');
    if (printBefore === 'printing' && this.shift.phase === 'complete') {
      this.robot.react('happy', 3.5);
      this.robot.animate(elapsed, 0.16, false);
      this.record = this.save.finish(this.shift.closedAt);
      this.ui.record(this.save.bestSeconds);
      this.ui.reportAvailable(true);
      this.showResults();
      this.audio.play('win');
      this.ui.notify('HR-01 · Поздравляю. Вы успешно распечатали доказательство своей ненужности.', 5);
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
      this.robot.animate(this.menuTime, dt, true);
      this.office.ambience(this.menuTime, 1);
    } else if (this.playing()) {
      this.player.aim(this.input.takeLook());
      this.robot.animate(this.shift.elapsed, dt, false);
      this.ui.hud(this.shift, this.hasCartridge(), this.hasFilter(), this.interaction.label(), this.interaction.held?.label ?? '');
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
    let target = this.cartridge.mesh.position;
    let name = 'КАРТРИДЖ';
    let height = 0.46;
    if (this.hasCartridge()) {
      target = PRINTER_POSITION;
      name = 'PR-404';
      height = 0.94;
    }
    if (this.shift.phase === 'complete' || this.hasFilter()) {
      if (this.shift.coffee === 'filter' && !this.hasFilter()) {
        target = this.filter.mesh.position;
        name = 'ФИЛЬТР';
      } else if (this.shift.coffee === 'filter' || this.shift.coffee === 'ready') {
        target = COFFEE_POSITION;
        name = 'BREW-OPS';
        height = 0.61;
      } else if (this.shift.robot === 'stuck') {
        target = this.robot.location;
        name = 'HR-01';
        height = 2.3;
      } else {
        this.ui.hideMarker();
        return;
      }
    }
    camera.updateMatrixWorld();
    this.cameraPoint.copy(target).applyMatrix4(camera.matrixWorldInverse);
    if (this.cameraPoint.z >= -0.1 || camera.position.distanceTo(target) < 2.05) {
      this.ui.hideMarker();
      return;
    }
    this.marker.copy(target);
    this.marker.y += height;
    this.marker.project(camera);
    const x = (this.marker.x + 1) * 50;
    const y = (1 - this.marker.y) * 50;
    this.ui.mark(Math.max(10, Math.min(90, x)), Math.max(24, Math.min(68, y)), name);
  }
}
