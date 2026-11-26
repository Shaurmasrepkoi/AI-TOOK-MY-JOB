interface TelegramWebApp {
  ready(): void;
  expand(): void;
  HapticFeedback?: { impactOccurred(style: 'light' | 'medium'): void };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export class Platform {
  private readonly telegram = window.Telegram?.WebApp;
  readonly touch = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !matchMedia('(any-pointer: fine)').matches);

  ready(): void {
    this.telegram?.ready();
    this.telegram?.expand();
  }

  feedback(strength: 'light' | 'medium'): void {
    this.telegram?.HapticFeedback?.impactOccurred(strength);
  }
}
