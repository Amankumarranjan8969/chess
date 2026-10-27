import { TimeControl } from '@chess/core';
import { GameRoom } from './GameRoom.js';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  public createRoom(
    timeControl: TimeControl = { initialMs: 300000, incrementMs: 3000 }
  ): GameRoom {
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

  public getRoomBySocket(socketId: string): GameRoom | undefined {
    const roomId = this.socketToRoom.get(socketId);
    return roomId ? this.getRoom(roomId) : undefined;
  }

  public associateSocket(socketId: string, roomId: string): void {
    this.socketToRoom.set(socketId, roomId.toUpperCase());
  }

  public removeSocket(socketId: string): GameRoom | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const { isEmpty } = room.removeOrDisconnectPlayer(socketId);
    if (isEmpty) {
      room.destroy();
      this.rooms.delete(roomId);
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

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
