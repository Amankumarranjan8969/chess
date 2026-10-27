import { Server, Socket } from 'socket.io';
import { Color, MoveInput, TimeControl } from '@chess/core';
import { RoomManager } from '../game/RoomManager.js';

export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket) => {
    // 1. Room Creation
    socket.on(
      'room:create',
      (
        data: { timeControl?: TimeControl; playerName?: string; preferredColor?: Color },
        callback?: (res: { success: boolean; roomId?: string; error?: string }) => void
      ) => {
        try {
          const room = roomManager.createRoom(data.timeControl);
          const playerName = data.playerName || 'Player 1';
          const joinResult = room.addPlayer(socket.id, playerName, data.preferredColor);

          socket.join(room.roomId);
          roomManager.associateSocket(socket.id, room.roomId);

          room.setGameOverCallback((result, reason) => {
            io.to(room.roomId).emit('game:ended', {
              result,
              reason,
              state: room.getSerializedState(),
            });
          });

          const serialized = room.getSerializedState();
          socket.emit('room:joined', {
            roomId: room.roomId,
            role: joinResult.role,
            color: joinResult.color,
            state: serialized,
          });

          if (callback) {
            callback({ success: true, roomId: room.roomId });
          }
        } catch (err: any) {
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    // 2. Room Joining
    socket.on(
      'room:join',
      (
        data: { roomId: string; playerName?: string },
        callback?: (res: { success: boolean; error?: string }) => void
      ) => {
        try {
          const room = roomManager.getRoom(data.roomId);
          if (!room) {
            if (callback) callback({ success: false, error: 'Room not found' });
            return;
          }

          const playerName = data.playerName || 'Player 2';
          const joinResult = room.addPlayer(socket.id, playerName);

          socket.join(room.roomId);
          roomManager.associateSocket(socket.id, room.roomId);

          const serialized = room.getSerializedState();
          socket.emit('room:joined', {
            roomId: room.roomId,
            role: joinResult.role,
            color: joinResult.color,
            state: serialized,
          });

          // Notify everyone in room of updated roster & state
          io.to(room.roomId).emit('room:updated', serialized);

          if (room.isReady()) {
            io.to(room.roomId).emit('match:ready', serialized);
          }

          if (callback) callback({ success: true });
        } catch (err: any) {
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    // 3. Move Submission
    socket.on(
      'game:move',
      (
        data: {
          roomId: string;
          move: MoveInput | string;
          clientTimestamp?: number;
        },
        callback?: (res: { success: boolean; error?: string }) => void
      ) => {
        const room = roomManager.getRoom(data.roomId);
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        const result = room.makeMove(
          socket.id,
          data.move,
          data.clientTimestamp ?? Date.now()
        );

        if (!result.success) {
          socket.emit('game:moveRejected', {
            error: result.error,
            state: room.getSerializedState(),
          });
          if (callback) callback({ success: false, error: result.error });
          return;
        }

        // Broadcast accepted move and fresh state to all room participants
        const serialized = room.getSerializedState();
        io.to(room.roomId).emit('game:moveAccepted', {
          move: result.move,
          state: serialized,
        });

        if (callback) callback({ success: true });
      }
    );

    // 4. Draw Offer
    socket.on('game:drawOffer', (data: { roomId: string }) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) return;

      const res = room.offerDraw(socket.id);
      if (res.success) {
        socket.to(room.roomId).emit('game:drawOffered', {
          byColor: room.getPlayerColor(socket.id),
        });
      }
    });

    // 5. Draw Response
    socket.on(
      'game:drawResponse',
      (data: { roomId: string; accept: boolean }) => {
        const room = roomManager.getRoom(data.roomId);
        if (!room) return;

        const res = room.respondDraw(socket.id, data.accept);
        if (res.success && res.accepted) {
          io.to(room.roomId).emit('game:ended', {
            result: '1/2-1/2',
            reason: 'agreement',
            state: room.getSerializedState(),
          });
        } else if (res.success && !res.accepted) {
          io.to(room.roomId).emit('game:drawDeclined');
        }
      }
    );

    // 6. Draw Claim (Threefold or Fifty-moves)
    socket.on(
      'game:claimDraw',
      (data: { roomId: string; type: 'threefold' | 'fifty_moves' }) => {
        const room = roomManager.getRoom(data.roomId);
        if (!room) return;

        const res = room.claimDraw(socket.id, data.type);
        if (res.success) {
          io.to(room.roomId).emit('game:ended', {
            result: '1/2-1/2',
            reason: data.type === 'threefold' ? 'threefold_repetition' : 'fifty_move_rule',
            state: room.getSerializedState(),
          });
        } else {
          socket.emit('game:claimRejected', { error: res.error });
        }
      }
    );

    // 7. Resignation
    socket.on('game:resign', (data: { roomId: string }) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) return;

      const color = room.getPlayerColor(socket.id);
      const res = room.resign(socket.id);
      if (res.success) {
        io.to(room.roomId).emit('game:ended', {
          result: color === 'w' ? '0-1' : '1-0',
          reason: 'resignation',
          state: room.getSerializedState(),
        });
      }
    });

    // 8. Reconnect / Sync State Request
    socket.on('game:sync', (data: { roomId: string }) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) {
        socket.emit('game:syncError', { error: 'Room does not exist' });
        return;
      }

      socket.emit('game:syncState', room.getSerializedState());
    });

    // 9. Disconnection Handling
    socket.on('disconnect', () => {
      const room = roomManager.removeSocket(socket.id);
      if (room && !room.isRoomAbandoned()) {
        io.to(room.roomId).emit('player:disconnected', {
          socketId: socket.id,
          state: room.getSerializedState(),
        });
      }
    });
  });
}
