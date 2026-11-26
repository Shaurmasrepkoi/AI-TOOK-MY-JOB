import { Howl, Howler } from 'howler';

type Cue = 'pick' | 'throw' | 'event' | 'win' | 'printer' | 'feed' | 'step' | 'click' | 'door' | 'coffee' | 'robot' | 'roll' | 'vend';
type Loop = 'music' | 'vent';
const TAU = Math.PI * 2;

function wave(frequency: number, time: number): number { return Math.sin(TAU * frequency * time); }

function wav(duration: number, sample: (time: number, noise: number) => number): string {
  const rate = 16000;
  const count = Math.round(rate * duration);
  const data = new DataView(new ArrayBuffer(44 + count * 2));
  const tag = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) data.setUint8(offset + i, value.charCodeAt(i));
  };
  tag(0, 'RIFF'); data.setUint32(4, 36 + count * 2, true);
  tag(8, 'WAVE'); tag(12, 'fmt '); data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, rate, true); data.setUint32(28, rate * 2, true);
  data.setUint16(32, 2, true); data.setUint16(34, 16, true);
  tag(36, 'data'); data.setUint32(40, count * 2, true);
  let random = 2027;
  let filtered = 0;
  for (let i = 0; i < count; i++) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    filtered = filtered * 0.63 + (random / 2147483648 - 1) * 0.37;
    data.setInt16(44 + i * 2, 32760 * Math.max(-1, Math.min(1, sample(i / rate, filtered))), true);
  }
  return URL.createObjectURL(new Blob([data.buffer], { type: 'audio/wav' }));
}

const cues: Record<Cue, readonly [readonly number[], number, number]> = {
  pick: [[340, 520], 0.19, 0.05],
  throw: [[185, 140], 0.19, 0.26],
  event: [[430, 310, 430], 0.42, 0.04],
  win: [[392, 494, 587, 784], 0.68, 0.04],
  printer: [[165, 110, 165, 125], 1.24, 0.51],
  feed: [[94, 115, 147, 96, 82], 1.42, 0.71],
  step: [[63], 0.20, 0.76],
  click: [[738, 254], 0.105, 0.37],
  door: [[85, 91, 137], 0.56, 0.67],
  coffee: [[96, 103, 96, 111, 104, 89], 2.8, 0.83],
  robot: [[277, 416, 554], 0.33, 0.13],
  roll: [[52, 61], 0.27, 0.59],
  vend: [[232, 312, 76], 0.59, 0.43],
};

function synth(cue: Cue): string {
  const [notes, length, grit] = cues[cue];
  return wav(length, (time, noise) => {
    const beat = time / length * notes.length;
    const phase = beat % 1;
    const frequency = notes[Math.floor(beat)] ?? 0;
    const envelope = Math.min(phase * 18, 1) * (1 - phase) ** 1.6;
    return 0.29 * envelope * ((1 - grit) * (wave(frequency, time) + 0.22 * wave(frequency * 2, time))
      + grit * (noise + 0.37 * wave(frequency, time)));
  });
}

function jingle(): string {
  const chords = [[130.81, 164.81, 196, 246.94], [110, 130.81, 164.81, 196], [87.31, 130.81, 174.61, 220], [98, 123.47, 146.83, 196]];
  const melody = [2, 1, 3, 2, 1, 0, 2, 3];
  return wav(16, (time) => {
    const chord = chords[Math.floor(time / 4)]!;
    const beat = Math.floor(time * 2);
    const phase = (time * 2) % 1;
    const note = chord[melody[beat % melody.length]!]! * 2;
    const pad = chord.reduce((total, frequency) => total + wave(frequency, time), 0) * 0.016;
    const attack = Math.min(1, phase * 19);
    const piano = (wave(note, time) + 0.16 * wave(note * 2, time)) * 0.12 * attack * (1 - phase) ** 2;
    const bar = time % 4;
    return pad * Math.min(1, bar * 3, (4 - bar) * 3) + piano;
  });
}

export class Audio {
  private readonly effects = new Map<Cue, Howl>();
  private readonly loops = new Map<Loop, { sound: Howl; id?: number }>();
  private active = false;

  constructor(private muted: boolean, private music: number, private effectsVolume: number) {}

  activate(active: boolean): void {
    this.active = active;
    if (active && !this.muted) {
      this.startLoop('music');
      this.startLoop('vent');
      if (Howler.ctx?.state === 'suspended') void Howler.ctx.resume().catch(() => {});
    } else {
      for (const { sound } of this.loops.values()) sound.pause();
      for (const effect of this.effects.values()) effect.stop();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.activate(this.active);
  }

  volume(music: number, effects: number): void {
    this.music = music;
    this.effectsVolume = effects;
    this.loops.get('music')?.sound.volume(music * 0.38);
    this.loops.get('vent')?.sound.volume(effects * 0.34);
    for (const effect of this.effects.values()) effect.volume(effects * 0.76);
  }

  play(cue: Cue): void {
    if (this.muted || this.effectsVolume === 0) return;
    let sound = this.effects.get(cue);
    if (!sound) {
      sound = new Howl({ src: [synth(cue)], format: ['wav'], volume: this.effectsVolume * 0.76 });
      this.effects.set(cue, sound);
    }
    sound.play();
  }

  private startLoop(key: Loop): void {
    let loop = this.loops.get(key);
    if (!loop) {
      const url = key === 'music' ? jingle() : wav(4, (time) =>
        0.13 * (wave(55, time) * (0.72 + 0.25 * wave(0.75, time)) + 0.18 * wave(110, time)));
      loop = { sound: new Howl({
        src: [url], format: ['wav'], loop: true, volume: key === 'music' ? this.music * 0.38 : this.effectsVolume * 0.34,
      }) };
      this.loops.set(key, loop);
    }
    if (loop.id === undefined || !loop.sound.playing(loop.id)) loop.id = loop.sound.play(loop.id);
  }
}
