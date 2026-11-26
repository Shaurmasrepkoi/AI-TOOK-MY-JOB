import { MathUtils } from 'three';
import type { Group } from 'three';

export class RobotMotion {
  constructor(
    private readonly shell: Group,
    private readonly head: Group,
    private readonly leftArm: Group,
    private readonly rightArm: Group,
  ) {}

  update(time: number, activity: 'idle' | 'patrol' | 'inspect', reaction: number): void {
    const wave = Math.sin(time * 5.5);
    const walking = activity === 'patrol' ? 1 : 0.25;
    this.shell.position.y = Math.sin(time * 3.8) * 0.038;
    this.head.rotation.z = Math.sin(time * 1.85) * 0.075;
    this.head.rotation.y = activity === 'inspect' ? Math.sin(time * 3) * 0.22 : 0;
    this.leftArm.rotation.x = wave * 0.22 * walking;
    this.rightArm.rotation.x = -wave * 0.22 * walking;
    this.rightArm.rotation.z = MathUtils.lerp(-0.11, -1.8 - wave * 0.32, reaction);
  }
}
