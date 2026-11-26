export type TaskPhase = 'collect' | 'deliver' | 'printing' | 'complete';
export type CoffeePhase = 'filter' | 'ready' | 'brewing' | 'complete';
export type RobotPhase = 'patrol' | 'stuck' | 'rebooting' | 'complete';

export const PRINT_DURATION = 3.4;
export const BREW_DURATION = 2.8;
const REBOOT_DURATION = 1.65;

export class Shift {
  phase: TaskPhase = 'collect';
  coffee: CoffeePhase = 'filter';
  robot: RobotPhase = 'patrol';
  elapsed = 0;
  closedAt = 0;
  printTime = 0;
  brewTime = 0;
  rebootTime = 0;

  reset(): void {
    this.phase = 'collect';
    this.coffee = 'filter';
    this.robot = 'patrol';
    this.elapsed = this.closedAt = this.printTime = this.brewTime = this.rebootTime = 0;
  }

  collected(): void {
    if (this.phase === 'collect') this.phase = 'deliver';
  }

  print(): void {
    if (this.phase === 'deliver') this.phase = 'printing';
  }

  installFilter(): void {
    if (this.coffee === 'filter') this.coffee = 'ready';
  }

  brew(): void {
    if (this.coffee === 'ready') this.coffee = 'brewing';
  }

  reboot(): void {
    if (this.robot === 'stuck') this.robot = 'rebooting';
  }

  step(dt: number): void {
    this.elapsed += dt;
    if (this.phase === 'printing') {
      this.printTime = Math.min(1, this.printTime + dt / PRINT_DURATION);
      if (this.printTime === 1) {
        this.phase = 'complete';
        this.closedAt = this.elapsed;
      }
    }
    if (this.coffee === 'brewing') {
      this.brewTime = Math.min(1, this.brewTime + dt / BREW_DURATION);
      if (this.brewTime === 1) this.coffee = 'complete';
    }
    if (this.robot === 'patrol' && this.elapsed >= 12) this.robot = 'stuck';
    if (this.robot === 'rebooting') {
      this.rebootTime = Math.min(1, this.rebootTime + dt / REBOOT_DURATION);
      if (this.rebootTime === 1) this.robot = 'complete';
    }
  }
}
