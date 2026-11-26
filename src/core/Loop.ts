export const FIXED_STEP = 1 / 60;

export class Loop {
  private previous = performance.now();
  private accumulator = 0;

  start(
    active: () => boolean,
    step: (dt: number) => void,
    frame: (dt: number) => void,
  ): void {
    const tick = (now: number) => {
      const dt = Math.min((now - this.previous) / 1000, 0.1);
      this.previous = now;
      this.accumulator = active() ? this.accumulator + dt : 0;
      while (this.accumulator >= FIXED_STEP && active()) {
        step(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
      frame(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
