export class Input {
  private readonly keys = new Set<string>();
  private readonly look = { x: 0, y: 0 };
  private readonly stick = { x: 0, y: 0 };
  private jumpPressed = false;
  private drag: { id: number; x: number; y: number } | null = null;
  private joystickPointer: number | null = null;
  private readonly thumb: HTMLElement;
  private readonly capturedKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyE', 'KeyQ', 'KeyF']);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    joystick: HTMLElement,
    private readonly active: () => boolean,
    private readonly command: (action: 'use' | 'throw' | 'drop' | 'pause') => void,
    readonly touch: boolean,
  ) {
    document.addEventListener('keydown', (event) => {
      if (!this.active()) return;
      if (this.capturedKeys.has(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.repeat) return;
      if (event.code === 'KeyE') this.command('use');
      if (event.code === 'KeyF') this.command('drop');
      if (event.code === 'KeyQ') this.command('throw');
      if (event.code === 'Space') this.jump();
      if (event.code === 'Escape') this.command('pause');
    });
    document.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('mousemove', (event) => {
      if (this.active() && document.pointerLockElement === canvas) {
        this.look.x += event.movementX;
        this.look.y += event.movementY;
      }
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    canvas.addEventListener('pointerdown', (event) => {
      if (!this.active()) return;
      if (document.pointerLockElement === canvas) {
        if (event.button === 0) this.command('throw');
        return;
      }
      if (this.drag !== null || (event.button !== 0 && event.button !== 2)) return;
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.drag?.id || !this.active()) return;
      this.look.x += event.clientX - this.drag.x;
      this.look.y += event.clientY - this.drag.y;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
    });
    canvas.addEventListener('lostpointercapture', (event) => {
      if (event.pointerId === this.drag?.id) this.drag = null;
    });

    this.thumb = joystick.firstElementChild as HTMLElement;
    const moveStick = (event: PointerEvent) => {
      const bounds = joystick.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width * 0.32);
      const y = (event.clientY - bounds.top - bounds.height / 2) / (bounds.width * 0.32);
      const length = Math.max(1, Math.hypot(x, y));
      this.stick.x = x / length;
      this.stick.y = y / length;
      this.thumb.style.transform = `translate(${this.stick.x * 29}px, ${this.stick.y * 29}px)`;
    };
    joystick.addEventListener('pointerdown', (event) => {
      if (!this.active() || this.joystickPointer !== null) return;
      this.joystickPointer = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      moveStick(event);
    });
    joystick.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.joystickPointer) moveStick(event);
    });
    joystick.addEventListener('lostpointercapture', (event) => {
      if (event.pointerId !== this.joystickPointer) return;
      this.joystickPointer = null;
      this.stick.x = this.stick.y = 0;
      this.thumb.style.transform = '';
    });
  }

  lock(): void {
    if (this.touch || !this.canvas.requestPointerLock) return;
    try {
      void this.canvas.requestPointerLock()?.catch(() => undefined);
    } catch {
      // Drag-to-look stays available when the embed blocks pointer lock.
    }
  }

  unlock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  clear(): void {
    this.drag = null;
    this.joystickPointer = null;
    this.thumb.style.transform = '';
    this.keys.clear();
    this.look.x = this.look.y = 0;
    this.stick.x = this.stick.y = 0;
    this.jumpPressed = false;
  }

  movement(): { x: number; z: number } {
    const x = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight'))
      - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.stick.x;
    const z = Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'))
      - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) + this.stick.y;
    const length = Math.max(1, Math.hypot(x, z));
    return { x: x / length, z: z / length };
  }

  takeLook(): { x: number; y: number } {
    const delta = { ...this.look };
    this.look.x = this.look.y = 0;
    return delta;
  }

  jump(): void { this.jumpPressed = true; }

  takeJump(): boolean {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }
}
