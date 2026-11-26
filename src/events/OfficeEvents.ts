export interface OfficeEvent {
  message: string;
  duration: number;
  light: (time: number) => number;
}

const events: readonly OfficeEvent[] = [
  {
    message: 'Энергосбережение. ИИ обнаружил, что светом пользуется только один сотрудник.',
    duration: 4.6,
    light: (time) => time < 0.7 ? 1 - 0.63 * time / 0.7 : 0.37,
  },
  {
    message: 'Обновление офиса. Если вы заметили мерцание, пожалуйста, перестаньте замечать.',
    duration: 3.4,
    light: (time) => 0.73 + 0.27 * Math.sin(time * 5),
  },
];

export class OfficeEvents {
  private next = 0;
  private elapsed = 0;
  private current: OfficeEvent | null = null;

  reset(): void {
    this.next = 10 + Math.random() * 6;
    this.current = null;
    this.elapsed = 0;
  }

  step(dt: number, announce: (event: OfficeEvent) => void): number {
    if (this.current) {
      this.elapsed += dt;
      if (this.elapsed < this.current.duration) return this.current.light(this.elapsed);
      this.current = null;
      this.next = 22 + Math.random() * 12;
    }
    this.next -= dt;
    if (this.next <= 0) {
      this.current = events[Math.floor(Math.random() * events.length)]!;
      this.elapsed = 0;
      announce(this.current);
    }
    return this.current ? this.current.light(0) : 1;
  }
}
