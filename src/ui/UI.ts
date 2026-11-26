import type { Shift } from '../tasks/Shift';
import type { Quality } from '../rendering/Renderer';

export type Screen = 'loading' | 'menu' | 'playing' | 'pause' | 'results' | 'error';
export type Action = 'start' | 'resume' | 'restart' | 'menu' | 'help' | 'mute' | 'pause' | 'use' | 'throw' | 'drop' | 'jump' | 'continue' | 'report' | 'settings';

export function clock(seconds: number): string {
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export class UI {
  readonly canvas: HTMLCanvasElement;
  readonly joystick: HTMLElement;
  private readonly app: HTMLElement;
  private readonly actions = new Map<Action, () => void>();
  private readonly dialog: HTMLDialogElement;
  private readonly settingsDialog: HTMLDialogElement;
  private readonly quality: HTMLSelectElement;
  private readonly music: HTMLInputElement;
  private readonly effects: HTMLInputElement;
  private readonly coffee: HTMLElement;
  private readonly robot: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly marker: HTMLElement;
  private readonly goal: HTMLElement;
  private readonly timer: HTMLElement;
  private readonly counter: HTMLElement;
  private readonly held: HTMLElement;
  private toastTime = 0;
  screen: Screen = 'loading';

  constructor(app: HTMLElement, touch: boolean) {
    this.app = app;
    app.dataset.touch = String(touch);
    app.innerHTML = `
      <canvas id="game" aria-label="Трёхмерный офис"></canvas>
      <div class="scrim"></div>
      <header class="masthead">
        <div class="brand"><span class="brand-mark" aria-hidden="true"><i></i></span><span>AUTO DIVISION<small>ОПЕРАЦИОННЫЙ ОТДЕЛ</small></span></div>
        <div class="mast-actions">
          <span class="build">LIVING OFFICE <span>0.2</span></span>
          <button type="button" class="icon-button" data-action="mute" aria-label="Выключить звук" title="Звук"><span class="speaker" aria-hidden="true"></span></button>
          <button type="button" class="icon-button pause-button" data-action="pause" aria-label="Пауза" title="Пауза"><span aria-hidden="true">Ⅱ</span></button>
        </div>
      </header>
      <section class="screen loading" data-panel="loading" aria-live="polite"><p class="label"><span class="status-dot"></span> Подключаем последнего сотрудника…</p></section>
      <section class="screen menu" data-panel="menu" hidden>
        <div class="hero">
          <div class="eyebrow"><span></span> ОФИСНЫЙ СИМУЛЯТОР &nbsp;/&nbsp; 2027</div>
          <h1>AI TOOK<br>MY <em>JOB.</em></h1>
          <p class="hero-copy">ИИ заменил весь офис. Кроме тебя.<br>Теперь ты отвечаешь за то, что он сломал.</p>
          <div class="menu-actions">
            <button type="button" class="primary" data-action="start"><span class="play-icon" aria-hidden="true"></span> Начать смену</button>
            <button type="button" class="secondary" data-action="help">Управление</button>
            <button type="button" class="secondary settings-menu" data-action="settings" aria-label="Настройки" title="Настройки">⚙</button>
          </div>
        </div>
        <div class="scene-tag"><span></span><div><strong>ПОМОЩНИК HR-01</strong><small>СОКРАЩАЕТ ДИСТАНЦИЮ. И ШТАТ.</small></div></div>
        <footer class="menu-footer"><span>СМЕНА 01 <b>·</b> LIVING OFFICE</span><span data-best>ОФИС AUTO DIVISION</span></footer>
      </section>
      <section class="screen hud" data-panel="playing" hidden>
        <div class="objective">
          <div class="objective-meta"><span><i></i> ЗАЯВКИ СМЕНЫ</span><span data-counter>0 / 3</span></div>
          <strong data-goal>Возьмите картридж</strong>
          <div class="service-line"><span data-coffee></span><span data-robot></span></div>
          <div class="shift-line"><span>СМЕНА 01</span><span data-timer>00:00</span></div>
        </div>
        <div class="crosshair" aria-hidden="true"></div>
        <div class="world-marker" aria-hidden="true" hidden><i></i><span></span></div>
        <div class="focus" hidden></div>
        <div class="held" hidden></div>
        <div class="toast" role="status" hidden></div>
        <div class="hud-keys"><kbd>WASD</kbd> Ходить <kbd>E</kbd> Действие <kbd>Q</kbd> Бросить <kbd>F</kbd> Отпустить <kbd>Esc</kbd> Пауза</div>
        <div class="touch-controls">
          <div class="joystick" aria-label="Джойстик движения"><span></span></div>
          <div class="touch-buttons">
            <button type="button" data-action="drop">Отпустить</button>
            <button type="button" data-action="throw">Бросить</button>
            <button type="button" data-action="jump">Прыжок</button>
            <button type="button" data-action="use" class="touch-use">Действие</button>
          </div>
        </div>
      </section>
      <section class="screen overlay" data-panel="pause" hidden>
        <div class="card">
          <p class="label">СМЕНА ПРИОСТАНОВЛЕНА</p>
          <h2>Перерыв.</h2>
          <p>Ваше отсутствие зарегистрировано.</p>
          <button type="button" class="primary" data-action="resume">Продолжить</button>
          <button type="button" class="secondary" data-action="settings">Настройки</button>
          <button type="button" class="secondary" data-action="report" hidden>Отчёт смены</button>
          <button type="button" class="secondary" data-action="menu">В главное меню</button>
        </div>
      </section>
      <section class="screen overlay" data-panel="results" hidden>
        <div class="card">
          <p class="label"><span class="status-dot"></span> СПРАВКА НАПЕЧАТАНА</p>
          <h2>Печать завершена.</h2>
          <p>HR-01 · Поздравляю. Вы распечатали доказательство собственной ненужности.</p>
          <p class="report-services" data-services></p>
          <div class="score"><span>ВРЕМЯ СМЕНЫ</span><strong data-score>00:00</strong><span data-record></span></div>
          <button type="button" class="primary" data-action="continue">Вернуться в офис</button>
          <button type="button" class="secondary" data-action="restart">Новая смена</button>
          <button type="button" class="secondary" data-action="menu">В главное меню</button>
        </div>
      </section>
      <section class="screen overlay" data-panel="error" hidden>
        <div class="card"><p class="label">СБОЙ ЗАПУСКА</p><h2>Офис закрыт.</h2><p data-error></p><button type="button" class="primary" data-reload>Повторить</button></div>
      </section>
      <dialog class="card help" data-help>
        <form method="dialog"><button class="icon-button close" aria-label="Закрыть">×</button></form>
        <p class="label">ПЕРЕД НАЧАЛОМ СМЕНЫ</p>
        <h2>Управление</h2>
        <dl class="desktop-help">
          <dt>Движение</dt><dd>WASD / стрелки</dd>
          <dt>Обзор</dt><dd>Мышь или перетаскивание по сцене</dd>
          <dt>Действие / взять</dt><dd>E</dd>
          <dt>Бросить / отпустить</dt><dd>Q / F</dd>
          <dt>Прыжок / пауза</dt><dd>Пробел / Esc</dd>
        </dl>
        <dl class="mobile-help">
          <dt>Движение</dt><dd>Джойстик слева</dd>
          <dt>Обзор</dt><dd>Проведите пальцем по офису</dd>
          <dt>Взять / использовать</dt><dd>Наведите прицел и нажмите «Действие»</dd>
        </dl>
      </dialog>
      <dialog class="card help preferences">
        <form method="dialog"><button class="icon-button close" aria-label="Закрыть настройки">×</button></form>
        <h2>Настройки</h2>
        <label>Качество графики <select data-quality><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Музыка <input data-music type="range" min="0" max="100" aria-label="Громкость музыки"></label>
        <label>Эффекты <input data-effects type="range" min="0" max="100" aria-label="Громкость эффектов"></label>
      </dialog>`;
    this.canvas = this.get('#game');
    this.joystick = this.get('.joystick');
    this.dialog = this.get('[data-help]');
    this.settingsDialog = this.get('.preferences');
    this.quality = this.get('[data-quality]');
    this.music = this.get('[data-music]');
    this.effects = this.get('[data-effects]');
    this.coffee = this.get('[data-coffee]');
    this.robot = this.get('[data-robot]');
    this.prompt = this.get('.focus');
    this.toast = this.get('.toast');
    this.marker = this.get('.world-marker');
    this.goal = this.get('[data-goal]');
    this.timer = this.get('[data-timer]');
    this.counter = this.get('[data-counter]');
    this.held = this.get('.held');
    for (const button of app.querySelectorAll<HTMLButtonElement>('[data-action]')) {
      button.addEventListener('click', () => this.actions.get(button.dataset.action as Action)?.());
    }
    this.on('help', () => this.dialog.showModal());
    this.on('settings', () => this.settingsDialog.showModal());
    this.get('[data-reload]').addEventListener('click', () => location.reload());
    this.show('loading');
  }

  on(action: Action, handler: () => void): void { this.actions.set(action, handler); }

  show(screen: Screen): void {
    const previous = this.screen;
    this.screen = screen;
    this.app.dataset.screen = screen;
    for (const panel of this.app.querySelectorAll<HTMLElement>('[data-panel]')) {
      panel.hidden = panel.dataset.panel !== screen;
    }
    if (screen === 'playing') {
      (document.activeElement as HTMLElement | null)?.blur();
    } else {
      this.prompt.hidden = this.marker.hidden = true;
      if (screen !== 'loading' && (screen !== 'menu' || previous !== 'loading')) {
        this.app.querySelector<HTMLButtonElement>(`[data-panel="${screen}"] button`)?.focus({ preventScroll: true });
      }
    }
  }

  settings(quality: Quality, music: number, effects: number, changeQuality: (quality: Quality) => void,
    changeVolume: (music: number, effects: number) => void): void {
    this.quality.value = quality;
    this.music.value = String(Math.round(music * 100));
    this.effects.value = String(Math.round(effects * 100));
    this.quality.addEventListener('change', () => changeQuality(this.quality.value as Quality));
    const volume = () => changeVolume(this.music.valueAsNumber / 100, this.effects.valueAsNumber / 100);
    this.music.addEventListener('input', volume);
    this.effects.addEventListener('input', volume);
  }

  hud(shift: Shift, carryingCartridge: boolean, carryingFilter: boolean, focus: string, held: string): void {
    const { phase, coffee, robot, elapsed } = shift;
    const coffeeDone = coffee === 'complete';
    const robotDone = robot === 'complete';
    const printDone = phase === 'complete';
    const coffeeGoal = coffee === 'brewing' ? 'BREW-OPS готовит кофе…'
      : coffee === 'ready' ? 'Сварите кофе в BREW-OPS'
      : carryingFilter ? 'Отнесите фильтр в зону отдыха' : 'Найдите фильтр BREW-OPS';
    const printGoal = phase === 'printing' ? 'PR-404 печатает…'
      : carryingCartridge ? 'Установите картридж в PR-404' : 'Возьмите картридж';
    const robotGoal = robot === 'rebooting' ? 'HR-01 перезагружается…'
      : robot === 'stuck' ? 'Подойдите к HR-01 и снимите блокировку' : 'HR-01 патрулирует офис';
    const goal = printDone ? (coffeeDone ? (robotDone ? 'Все заявки закрыты' : robotGoal) : coffeeGoal) : carryingFilter && phase !== 'printing' ? coffeeGoal : printGoal;
    this.setText(this.goal, goal);
    this.setText(this.coffee, coffeeDone ? '✓ BREW-OPS' : coffee === 'brewing' ? '◌ BREW-OPS' : '◇ BREW-OPS');
    this.setText(this.robot, robotDone ? '✓ HR-01' : robot === 'patrol' ? '· HR-01' : '◇ HR-01');
    this.setText(this.counter, `${Number(printDone) + Number(coffeeDone) + Number(robotDone)} / 3`);
    this.setText(this.timer, clock(elapsed));
    this.app.dataset.focus = String(Boolean(focus));
    this.setText(this.prompt, focus ? (this.app.dataset.touch === 'true' ? focus : `E  ·  ${focus}`) : '');
    this.prompt.hidden = !focus;
    this.setText(this.held, held ? `В РУКАХ · ${held}` : '');
    this.held.hidden = !held;
    this.app.dataset.holding = String(Boolean(held));
  }

  mark(x: number, y: number, text: string): void {
    this.marker.hidden = false;
    this.marker.style.left = `${x.toFixed(1)}%`;
    this.marker.style.top = `${y.toFixed(1)}%`;
    this.setText(this.marker.lastElementChild!, text);
  }

  hideMarker(): void { this.marker.hidden = true; }

  get hasNotification(): boolean { return this.toastTime > 0; }

  notify(message: string, seconds = 3.5): void {
    this.toastTime = seconds;
    this.toast.hidden = false;
    this.toast.textContent = message;
  }

  step(dt: number): void {
    if (this.toastTime <= 0) return;
    this.toastTime -= dt;
    if (this.toastTime <= 0) this.clearNotification();
  }

  clearNotification(): void {
    this.toastTime = 0;
    this.toast.hidden = true;
  }

  sound(muted: boolean): void {
    const button = this.get('[data-action="mute"]');
    button.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
    button.setAttribute('aria-pressed', String(muted));
    button.classList.toggle('muted', muted);
  }

  record(best: number | null): void {
    this.get('[data-best]').textContent = best === null ? 'ОФИС AUTO DIVISION' : `ЛИЧНЫЙ РЕКОРД · ${clock(best)}`;
  }

  reportAvailable(available: boolean): void {
    this.get('[data-action="report"]').hidden = !available;
  }

  results(seconds: number, record: boolean, coffee: boolean, robot: boolean): void {
    this.get('[data-action="continue"]').hidden = coffee && robot;
    this.get('[data-action="restart"]').classList.toggle('primary', coffee && robot);
    this.get('[data-action="restart"]').classList.toggle('secondary', !coffee || !robot);
    this.get('[data-services]').textContent =
      `BREW-OPS · ${coffee ? 'кофе готов' : 'ожидает ремонта'} / HR-01 · ${robot ? 'патруль восстановлен' : 'заявка открыта'}`;
    this.get('[data-score]').textContent = clock(seconds);
    this.get('[data-record]').textContent = record ? 'ЛИЧНЫЙ РЕКОРД' : '';
    this.show('results');
  }

  error(message: string): void {
    this.get('[data-error]').textContent = message;
    this.show('error');
  }

  private get<T extends HTMLElement = HTMLElement>(selector: string): T {
    return this.app.querySelector<T>(selector)!;
  }

  private setText(element: Element, value: string): void {
    if (element.textContent !== value) element.textContent = value;
  }
}
