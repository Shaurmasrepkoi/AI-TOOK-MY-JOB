export type TaskPhase = 'collect' | 'deliver' | 'printing' | 'complete';

export class Shift {
  phase: TaskPhase = 'collect';
  elapsed = 0;
  printTime = 0;

  reset(): void {
    this.phase = 'collect';
    this.elapsed = 0;
    this.printTime = 0;
  }

  collected(): void {
    if (this.phase === 'collect') this.phase = 'deliver';
  }

  print(): void {
    if (this.phase === 'deliver') this.phase = 'printing';
  }

  step(dt: number): void {
    if (this.phase === 'complete') return;
    this.elapsed += dt;
    if (this.phase !== 'printing') return;
    this.printTime = Math.min(1, this.printTime + dt / 1.35);
    if (this.printTime === 1) this.phase = 'complete';
  }
}
