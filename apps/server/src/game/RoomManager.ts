import { randomInt } from 'node:crypto';
import { TimeControl } from '@chess/core';
import { GameRoom } from './GameRoom.js';

export interface Membership {
  roomId: string;
  /** Seat key: the client's persistent player key (or the socket id if none was supplied). */
  playerKey: string;
}

export const MAX_ROOMS = 500;
const ROOM_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private memberships: Map<string, Membership> = new Map();
  /** roomId|playerKey -> the socket currently holding that seat (guards against stale disconnects). */
  private activeSockets: Map<string, string> = new Map();

  public createRoom(
    timeControl: TimeControl = { initialMs: 300000, incrementMs: 3000 }
  ): GameRoom {
    if (this.rooms.size >= MAX_ROOMS) {
      throw new Error('The server is busy right now. Please try again in a few minutes.');
    }
    let roomId = this.generateRoomId();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomId();
    }

    const room = new GameRoom(roomId, timeControl);
    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getMembership(socketId: string): Membership | undefined {
    return this.memberships.get(socketId);
  }

  public getRoomBySocket(socketId: string): GameRoom | undefined {
    const m = this.memberships.get(socketId);
    return m ? this.getRoom(m.roomId) : undefined;
  }

  public associateSocket(socketId: string, roomId: string, playerKey: string): void {
    const upper = roomId.toUpperCase();
    this.memberships.set(socketId, { roomId: upper, playerKey });
    this.activeSockets.set(`${upper}|${playerKey}`, socketId);
  }

  /**
   * Detaches a socket from its room. Returns the room only when this socket was the active
   * holder of its seat, i.e. when other participants should be told the player left.
   */
  public removeSocket(socketId: string): GameRoom | undefined {
    const membership = this.memberships.get(socketId);
    if (!membership) return undefined;
    this.memberships.delete(socketId);

    const seatKey = `${membership.roomId}|${membership.playerKey}`;
    if (this.activeSockets.get(seatKey) !== socketId) {
      return undefined; // the player already reconnected on a newer socket
    }
    this.activeSockets.delete(seatKey);

    const room = this.rooms.get(membership.roomId);
    if (!room) return undefined;

    const { isEmpty } = room.removeOrDisconnectPlayer(membership.playerKey);
    if (isEmpty) {
      room.destroy();
      this.rooms.delete(membership.roomId);
    }

    return room;
  }

  public removeRoom(roomId: string): void {
    const upper = roomId.toUpperCase();
    const room = this.rooms.get(upper);
    if (room) {
      room.destroy();
      this.rooms.delete(upper);
    }
  }

  /** Removes rooms nobody can still be using. */
  public sweep(now: number = Date.now()): void {
    for (const [roomId, room] of this.rooms) {
      if (room.isRoomAbandoned() || now - room.createdAt > ROOM_MAX_AGE_MS) {
        this.removeRoom(roomId);
      }
    }
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(randomInt(chars.length));
    }
    return code;
  }
}
