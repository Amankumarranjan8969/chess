import { Server, Socket } from 'socket.io';
import { RoomManager } from '../game/RoomManager.js';
import { GameRoom } from '../game/GameRoom.js';
import { RateLimiter } from '../security/rateLimit.js';
import {
  ValidationError,
  isPlainObject,
  parseColor,
  parseDrawType,
  parseMove,
  parsePlayerKey,
  parseRoomId,
  parseTimeControl,
  sanitizeName,
} from '../security/validation.js';

type Ack = (res: { success: boolean; roomId?: string; error?: string }) => void;
const noopAck: Ack = () => undefined;

const MAX_CONNECTIONS_PER_IP = 30;
/** Per-socket event budget: generous for real play (moves, draws, resigns), hostile floods get cut off. */
const EVENTS_PER_WINDOW = 60;
const EVENT_WINDOW_MS = 10_000;
const MAX_STRIKES_BEFORE_DISCONNECT = 10;

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  const connectionsPerIp = new Map<string, number>();
  const createLimiter = new RateLimiter(10, 60_000);
  const joinLimiter = new RateLimiter(30, 60_000);

  /** Detaches a socket from whatever room it is in and informs the remaining participants. */
  const detach = (socket: Socket): void => {
    const membership = roomManager.getMembership(socket.id);
    if (!membership) return;
    socket.leave(membership.roomId);
    const room = roomManager.removeSocket(socket.id);
    if (room && !room.isRoomAbandoned()) {
      io.to(room.roomId).emit('player:disconnected', { state: room.getPublicState() });
    }
  };

  io.on('connection', (socket: Socket) => {
    const ip = socket.handshake.address;

    // ---- Connection & flood protection ----------------------------------------------
    const open = connectionsPerIp.get(ip) ?? 0;
    if (open >= MAX_CONNECTIONS_PER_IP) {
      socket.disconnect(true);
      return;
    }
    connectionsPerIp.set(ip, open + 1);

    // Middleware errors surface as 'error' events; without a listener socket.io logs noisily.
    socket.on('error', () => undefined);

    const eventLimiter = new RateLimiter(EVENTS_PER_WINDOW, EVENT_WINDOW_MS);
    let strikes = 0;
    socket.use((_packet, next) => {
      if (eventLimiter.allow('events')) {
        next();
        return;
      }
      strikes += 1;
      if (strikes >= MAX_STRIKES_BEFORE_DISCONNECT) socket.disconnect(true);
      next(new Error('Rate limit exceeded'));
    });

    /**
     * Registers an event handler that can never take the process down: payloads must be plain
     * objects, validation errors are returned to the caller, anything unexpected is logged
     * server-side and answered with a generic message.
     */
    const on = (
      event: string,
      handler: (data: Record<string, unknown>, ack: Ack) => void
    ): void => {
      socket.on(event, (payload: unknown, maybeAck: unknown) => {
        // Clients may emit(event, callback) with no payload.
        const ack: Ack =
          typeof maybeAck === 'function'
            ? (maybeAck as Ack)
            : typeof payload === 'function'
            ? (payload as Ack)
            : noopAck;
        const reply = (res: Parameters<Ack>[0]) => {
          try {
            ack(res);
          } catch {
            /* a misbehaving client callback must not affect the server */
          }
          if (!res.success && ack === noopAck && res.error) {
            socket.emit('game:error', { error: res.error });
          }
        };

        try {
          if (!isPlainObject(payload)) {
            reply({ success: false, error: 'Invalid request' });
            return;
          }
          handler(payload, reply);
        } catch (err) {
          if (err instanceof ValidationError) {
            reply({ success: false, error: err.message });
          } else if (err instanceof Error && err.message === 'This room is full') {
            reply({ success: false, error: err.message });
          } else if (err instanceof Error && /server is busy/i.test(err.message)) {
            reply({ success: false, error: err.message });
          } else {
            console.error(`[ChessServer] Unhandled error in "${event}":`, err);
            reply({ success: false, error: 'Something went wrong. Please try again.' });
          }
        }
      });
    };

    /** The room this socket currently belongs to, plus its seat key. */
    const currentRoom = (): { room: GameRoom; key: string } => {
      const membership = roomManager.getMembership(socket.id);
      const room = membership ? roomManager.getRoom(membership.roomId) : undefined;
      if (!membership || !room) throw new ValidationError('You are not in a game');
      return { room, key: membership.playerKey };
    };

    // 1. Room Creation
    on('room:create', (data, ack) => {
      if (!createLimiter.allow(ip)) {
        throw new ValidationError('You are creating rooms too quickly. Please wait a moment.');
      }
      const timeControl = parseTimeControl(data.timeControl);
      const playerName = sanitizeName(data.playerName, 'Player 1');
      const preferredColor = parseColor(data.preferredColor);
      const key = parsePlayerKey(data.playerKey) ?? socket.id;

      detach(socket); // a socket occupies at most one room

      const room = roomManager.createRoom(timeControl);
      let joinResult;
      try {
        joinResult = room.addPlayer(key, playerName, preferredColor);
      } catch (err) {
        roomManager.removeRoom(room.roomId);
        throw err;
      }

      socket.join(room.roomId);
      roomManager.associateSocket(socket.id, room.roomId, key);

      room.setGameOverCallback((result, reason) => {
        io.to(room.roomId).emit('game:ended', {
          result,
          reason,
          state: room.getPublicState(),
        });
      });

      socket.emit('room:joined', {
        roomId: room.roomId,
        role: joinResult.role,
        color: joinResult.color,
        state: room.getPublicState(),
      });

      ack({ success: true, roomId: room.roomId });
    });

    // 2. Room Joining (also used to reclaim a seat after reconnecting)
    on('room:join', (data, ack) => {
      if (!joinLimiter.allow(ip)) {
        throw new ValidationError('Too many attempts. Please wait a moment.');
      }
      const roomId = parseRoomId(data.roomId);
      const room = roomManager.getRoom(roomId);
      if (!room) {
        ack({ success: false, error: 'Room not found' });
        return;
      }

      const playerName = sanitizeName(data.playerName, 'Player 2');
      const key = parsePlayerKey(data.playerKey) ?? socket.id;

      const existing = roomManager.getMembership(socket.id);
      if (existing && existing.roomId !== room.roomId) detach(socket);

      const joinResult = room.addPlayer(key, playerName);

      socket.join(room.roomId);
      roomManager.associateSocket(socket.id, room.roomId, key);

      const state = room.getPublicState();
      socket.emit('room:joined', {
        roomId: room.roomId,
        role: joinResult.role,
        color: joinResult.color,
        state,
      });

      // Notify everyone in room of updated roster & state
      io.to(room.roomId).emit('room:updated', state);
      if (room.isReady()) {
        io.to(room.roomId).emit('match:ready', state);
      }

      ack({ success: true });
    });

    // 3. Move Submission (clock accounting uses server time only; any client timestamp is ignored)
    on('game:move', (data, ack) => {
      const { room, key } = currentRoom();
      const move = parseMove(data.move);

      const result = room.makeMove(key, move);
      if (!result.success) {
        socket.emit('game:moveRejected', {
          error: result.error,
          state: room.getPublicState(),
        });
        ack({ success: false, error: result.error });
        return;
      }

      io.to(room.roomId).emit('game:moveAccepted', {
        move: result.move,
        state: room.getPublicState(),
      });
      ack({ success: true });
    });

    // 4. Draw Offer
    on('game:drawOffer', () => {
      const { room, key } = currentRoom();
      const res = room.offerDraw(key);
      if (res.success) {
        socket.to(room.roomId).emit('game:drawOffered', {
          byColor: room.getPlayerColor(key),
        });
      }
    });

    // 5. Draw Response
    on('game:drawResponse', (data) => {
      const { room, key } = currentRoom();
      if (typeof data.accept !== 'boolean') throw new ValidationError('Invalid response');

      const res = room.respondDraw(key, data.accept);
      if (res.success && res.accepted) {
        io.to(room.roomId).emit('game:ended', {
          result: '1/2-1/2',
          reason: 'agreement',
          state: room.getPublicState(),
        });
      } else if (res.success && !res.accepted) {
        io.to(room.roomId).emit('game:drawDeclined');
      }
    });

    // 6. Draw Claim (Threefold or Fifty-moves)
    on('game:claimDraw', (data, ack) => {
      const { room, key } = currentRoom();
      const type = parseDrawType(data.type);

      const res = room.claimDraw(key, type);
      if (res.success) {
        io.to(room.roomId).emit('game:ended', {
          result: '1/2-1/2',
          reason: type === 'threefold' ? 'threefold_repetition' : 'fifty_move_rule',
          state: room.getPublicState(),
        });
      } else {
        socket.emit('game:claimRejected', { error: res.error });
        ack({ success: false, error: res.error });
      }
    });

    // 7. Resignation
    on('game:resign', () => {
      const { room, key } = currentRoom();
      const color = room.getPlayerColor(key);
      const res = room.resign(key);
      if (res.success) {
        io.to(room.roomId).emit('game:ended', {
          result: color === 'w' ? '0-1' : '1-0',
          reason: 'resignation',
          state: room.getPublicState(),
        });
      }
    });

    // 8. Reconnect / Sync State Request
    on('game:sync', () => {
      const membership = roomManager.getMembership(socket.id);
      const room = membership ? roomManager.getRoom(membership.roomId) : undefined;
      if (!room) {
        socket.emit('game:syncError', { error: 'Room does not exist' });
        return;
      }
      socket.emit('game:syncState', room.getPublicState());
    });

    // 9. Disconnection Handling
    socket.on('disconnect', () => {
      const count = connectionsPerIp.get(ip) ?? 1;
      if (count <= 1) connectionsPerIp.delete(ip);
      else connectionsPerIp.set(ip, count - 1);
      detach(socket);
    });
  });

  return {
    sweep: () => {
      createLimiter.sweep();
      joinLimiter.sweep();
    },
  };
}
