import { ClockState, Color, TimeControl } from '../types/index.js';

export class ChessClock {
  private whiteMs: number;
  private blackMs: number;
  private readonly incrementMs: number;
  private activeColor: Color | null = null;
  private turnStartedAtMs: number | null = null;
  private isPaused: boolean = true;
  private flagFallen: boolean = false;
  private clockVersion: number = 0;

  constructor(timeControl: TimeControl, initialState?: Partial<ClockState>) {
    this.whiteMs = initialState?.whiteRemainingMs ?? timeControl.initialMs;
    this.blackMs = initialState?.blackRemainingMs ?? timeControl.initialMs;
    this.incrementMs = timeControl.incrementMs;
    this.activeColor = initialState?.activeColor ?? null;
    this.turnStartedAtMs = initialState?.turnStartedAtMs ?? null;
    this.isPaused = initialState?.isPaused ?? true;
    this.flagFallen = initialState?.flagFallen ?? false;
    this.clockVersion = initialState?.clockVersion ?? 0;
  }

  public start(color: Color, now: number = Date.now()): void {
    if (this.flagFallen) return;
    this.activeColor = color;
    this.turnStartedAtMs = now;
    this.isPaused = false;
    this.clockVersion++;
  }

  public pause(now: number = Date.now()): void {
    if (this.isPaused) return;
    this.syncRemainingTime(now);
    this.isPaused = true;
    this.turnStartedAtMs = null;
    this.clockVersion++;
  }

  public resume(now: number = Date.now()): void {
    if (!this.isPaused || this.flagFallen || !this.activeColor) return;
    this.turnStartedAtMs = now;
    this.isPaused = false;
    this.clockVersion++;
  }

  public switchTurn(nextColor: Color, now: number = Date.now()): void {
    if (this.flagFallen) return;

    if (!this.isPaused && this.activeColor) {
      this.syncRemainingTime(now);

      // Add increment to the player who just finished their turn
      if (this.activeColor === 'w') {
        this.whiteMs += this.incrementMs;
      } else {
        this.blackMs += this.incrementMs;
      }
    }

    this.activeColor = nextColor;
    this.turnStartedAtMs = now;
    this.isPaused = false;
    this.clockVersion++;
  }

  public checkFlagFall(now: number = Date.now()): { hasFlagFallen: boolean; fallenColor: Color | null } {
    if (this.flagFallen) {
      const fallen = this.whiteMs <= 0 ? 'w' : this.blackMs <= 0 ? 'b' : null;
      return { hasFlagFallen: true, fallenColor: fallen };
    }

    this.syncRemainingTime(now);

    if (this.whiteMs <= 0) {
      this.whiteMs = 0;
      this.flagFallen = true;
      this.isPaused = true;
      this.clockVersion++;
      return { hasFlagFallen: true, fallenColor: 'w' };
    }

    if (this.blackMs <= 0) {
      this.blackMs = 0;
      this.flagFallen = true;
      this.isPaused = true;
      this.clockVersion++;
      return { hasFlagFallen: true, fallenColor: 'b' };
    }

    return { hasFlagFallen: false, fallenColor: null };
  }

  public getState(now: number = Date.now()): ClockState {
    const calculated = this.calculateRemaining(now);
    return {
      whiteRemainingMs: calculated.whiteMs,
      blackRemainingMs: calculated.blackMs,
      activeColor: this.activeColor,
      turnStartedAtMs: this.turnStartedAtMs,
      isPaused: this.isPaused,
      flagFallen: this.flagFallen || calculated.whiteMs <= 0 || calculated.blackMs <= 0,
      clockVersion: this.clockVersion,
    };
  }

  private calculateRemaining(now: number): { whiteMs: number; blackMs: number } {
    if (this.isPaused || !this.turnStartedAtMs || !this.activeColor) {
      return { whiteMs: this.whiteMs, blackMs: this.blackMs };
    }

    const elapsed = Math.max(0, now - this.turnStartedAtMs);

    if (this.activeColor === 'w') {
      return {
        whiteMs: Math.max(0, this.whiteMs - elapsed),
        blackMs: this.blackMs,
      };
    } else {
      return {
        whiteMs: this.whiteMs,
        blackMs: Math.max(0, this.blackMs - elapsed),
      };
    }
  }

  private syncRemainingTime(now: number): void {
    const remaining = this.calculateRemaining(now);
    this.whiteMs = remaining.whiteMs;
    this.blackMs = remaining.blackMs;
    this.turnStartedAtMs = now;
  }
}
