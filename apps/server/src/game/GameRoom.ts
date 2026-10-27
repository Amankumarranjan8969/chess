import {
  ChessGame,
  Color,
  DetailedMove,
  EndReason,
  GameResult,
  GameSnapshot,
  MoveInput,
  TimeControl,
} from '@chess/core';

export interface RoomPlayer {
  id: string; // socket ID or persistent user ID
  name: string;
  color: Color;
  connected: boolean;
}

export interface SerializedRoomState {
  roomId: string;
  whitePlayer: RoomPlayer | null;
  blackPlayer: RoomPlayer | null;
  spectatorCount: number;
  timeControl: TimeControl;
  drawOfferedBy: Color | null;
  gameState: GameSnapshot;
}

export class GameRoom {
  public readonly roomId: string;
  public readonly timeControl: TimeControl;
  private game: ChessGame;
  private whitePlayer: RoomPlayer | null = null;
  private blackPlayer: RoomPlayer | null = null;
  private spectators: Map<string, { id: string; name: string }> = new Map();
  private drawOfferedBy: Color | null = null;
  private flagCheckTimer?: NodeJS.Timeout;
  private onGameOverCallback?: (result: GameResult, reason: EndReason) => void;

  constructor(
    roomId: string,
    timeControl: TimeControl = { initialMs: 300000, incrementMs: 3000 }
  ) {
    this.roomId = roomId;
    this.timeControl = timeControl;
    this.game = new ChessGame(undefined, { timeControl });
  }

  public setGameOverCallback(cb: (result: GameResult, reason: EndReason) => void): void {
    this.onGameOverCallback = cb;
  }

  public addPlayer(
    id: string,
    name: string,
    preferredColor?: Color
  ): { role: 'player' | 'spectator'; color?: Color } {
    // If user is reconnecting
    if (this.whitePlayer && this.whitePlayer.id === id) {
      this.whitePlayer.connected = true;
      return { role: 'player', color: 'w' };
    }
    if (this.blackPlayer && this.blackPlayer.id === id) {
      this.blackPlayer.connected = true;
      return { role: 'player', color: 'b' };
    }

    // Assign open slots
    if (!this.whitePlayer && !this.blackPlayer) {
      const assigned = preferredColor ?? (Math.random() > 0.5 ? 'w' : 'b');
      const player: RoomPlayer = { id, name, color: assigned, connected: true };
      if (assigned === 'w') {
        this.whitePlayer = player;
      } else {
        this.blackPlayer = player;
      }
      return { role: 'player', color: assigned };
    }

    if (!this.whitePlayer) {
      this.whitePlayer = { id, name, color: 'w', connected: true };
      this.checkStartClock();
      return { role: 'player', color: 'w' };
    }

    if (!this.blackPlayer) {
      this.blackPlayer = { id, name, color: 'b', connected: true };
      this.checkStartClock();
      return { role: 'player', color: 'b' };
    }

    // Room is full for players, join as spectator
    this.spectators.set(id, { id, name });
    return { role: 'spectator' };
  }

  public removeOrDisconnectPlayer(id: string): {
    wasPlayer: boolean;
    color?: Color;
    isEmpty: boolean;
  } {
    if (this.whitePlayer && this.whitePlayer.id === id) {
      this.whitePlayer.connected = false;
      return { wasPlayer: true, color: 'w', isEmpty: this.isRoomAbandoned() };
    }
    if (this.blackPlayer && this.blackPlayer.id === id) {
      this.blackPlayer.connected = false;
      return { wasPlayer: true, color: 'b', isEmpty: this.isRoomAbandoned() };
    }
    if (this.spectators.has(id)) {
      this.spectators.delete(id);
      return { wasPlayer: false, isEmpty: this.isRoomAbandoned() };
    }

    return { wasPlayer: false, isEmpty: this.isRoomAbandoned() };
  }

  public isRoomAbandoned(): boolean {
    const whiteAbsent = !this.whitePlayer || !this.whitePlayer.connected;
    const blackAbsent = !this.blackPlayer || !this.blackPlayer.connected;
    return whiteAbsent && blackAbsent && this.spectators.size === 0;
  }

  public isReady(): boolean {
    return (
      Boolean(this.whitePlayer?.connected) &&
      Boolean(this.blackPlayer?.connected)
    );
  }

  public makeMove(
    id: string,
    moveInput: MoveInput | string,
    clientTimestamp: number = Date.now()
  ): { success: boolean; move?: DetailedMove; error?: string } {
    // 1. Authorize player
    const playerColor = this.getPlayerColor(id);
    if (!playerColor) {
      return { success: false, error: 'You are not a participant in this game' };
    }

    // 2. Check if both players joined
    if (!this.whitePlayer || !this.blackPlayer) {
      return { success: false, error: 'Waiting for an opponent to join' };
    }

    // 3. Verify turn
    const currentTurn = this.game.getSideToMove();
    if (playerColor !== currentTurn) {
      return { success: false, error: 'Not your turn' };
    }

    // Reset any pending draw offer upon making a move
    this.drawOfferedBy = null;

    // 4. Execute authoritative move in core
    const res = this.game.makeMove(moveInput, clientTimestamp);
    if (!res.success) {
      return res;
    }

    // 5. Check if game finished
    const snapshot = this.game.getSnapshot();
    if (snapshot.status === 'finished') {
      this.stopFlagCheckTimer();
      if (this.onGameOverCallback && snapshot.result && snapshot.endReason) {
        this.onGameOverCallback(snapshot.result, snapshot.endReason);
      }
    }

    return res;
  }

  public offerDraw(id: string): { success: boolean; error?: string } {
    const color = this.getPlayerColor(id);
    if (!color) return { success: false, error: 'Unauthorized' };
    if (this.game.getSnapshot().status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    this.drawOfferedBy = color;
    return { success: true };
  }

  public respondDraw(id: string, accept: boolean): {
    success: boolean;
    accepted: boolean;
    error?: string;
  } {
    const color = this.getPlayerColor(id);
    if (!color) return { success: false, accepted: false, error: 'Unauthorized' };
    if (!this.drawOfferedBy || this.drawOfferedBy === color) {
      return {
        success: false,
        accepted: false,
        error: 'No active draw offer from your opponent',
      };
    }

    if (accept) {
      this.game.agreeDraw();
      this.drawOfferedBy = null;
      this.stopFlagCheckTimer();
      const snap = this.game.getSnapshot();
      if (this.onGameOverCallback && snap.result && snap.endReason) {
        this.onGameOverCallback(snap.result, snap.endReason);
      }
      return { success: true, accepted: true };
    } else {
      this.drawOfferedBy = null;
      return { success: true, accepted: false };
    }
  }

  public claimDraw(
    id: string,
    type: 'threefold' | 'fifty_moves'
  ): { success: boolean; error?: string } {
    const color = this.getPlayerColor(id);
    if (!color) return { success: false, error: 'Unauthorized' };

    const res = this.game.claimDraw(type);
    if (res.success) {
      this.stopFlagCheckTimer();
      const snap = this.game.getSnapshot();
      if (this.onGameOverCallback && snap.result && snap.endReason) {
        this.onGameOverCallback(snap.result, snap.endReason);
      }
    }
    return res;
  }

  public resign(id: string): { success: boolean; error?: string } {
    const color = this.getPlayerColor(id);
    if (!color) return { success: false, error: 'Unauthorized' };
    if (this.game.getSnapshot().status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    this.game.resign(color);
    this.stopFlagCheckTimer();
    const snap = this.game.getSnapshot();
    if (this.onGameOverCallback && snap.result && snap.endReason) {
      this.onGameOverCallback(snap.result, snap.endReason);
    }
    return { success: true };
  }

  public getPlayerColor(id: string): Color | null {
    if (this.whitePlayer?.id === id) return 'w';
    if (this.blackPlayer?.id === id) return 'b';
    return null;
  }

  public getSerializedState(now: number = Date.now()): SerializedRoomState {
    return {
      roomId: this.roomId,
      whitePlayer: this.whitePlayer,
      blackPlayer: this.blackPlayer,
      spectatorCount: this.spectators.size,
      timeControl: this.timeControl,
      drawOfferedBy: this.drawOfferedBy,
      gameState: this.game.getSnapshot(now),
    };
  }

  public destroy(): void {
    this.stopFlagCheckTimer();
  }

  private checkStartClock(): void {
    if (this.whitePlayer && this.blackPlayer) {
      const clock = this.game.getClock();
      if (clock) {
        clock.resume();
        this.startFlagCheckTimer();
      }
    }
  }

  private startFlagCheckTimer(): void {
    this.stopFlagCheckTimer();
    this.flagCheckTimer = setInterval(() => {
      const clock = this.game.getClock();
      if (!clock) return;

      const flag = clock.checkFlagFall();
      if (flag.hasFlagFallen && flag.fallenColor) {
        this.game.handleTimeout(flag.fallenColor);
        this.stopFlagCheckTimer();
        const snap = this.game.getSnapshot();
        if (this.onGameOverCallback && snap.result && snap.endReason) {
          this.onGameOverCallback(snap.result, snap.endReason);
        }
      }
    }, 250);
  }

  private stopFlagCheckTimer(): void {
    if (this.flagCheckTimer) {
      clearInterval(this.flagCheckTimer);
      this.flagCheckTimer = undefined;
    }
  }
}
