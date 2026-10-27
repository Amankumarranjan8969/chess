import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Color, MoveInput, TimeControl } from '@chess/core';
import { soundManager } from '../audio/soundManager.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export function useChessSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<any | null>(null);
  const [playerColor, setPlayerColor] = useState<Color | 'spectator' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDrawOffer, setPendingDrawOffer] = useState<boolean>(false);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setErrorMessage(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room:joined', (data) => {
      setPlayerColor(data.color || data.role);
      setRoomState(data.state);
    });

    socket.on('room:updated', (state) => {
      setRoomState(state);
    });

    socket.on('match:ready', (state) => {
      setRoomState(state);
      soundManager.playMove();
    });

    socket.on('game:moveAccepted', (data) => {
      setRoomState(data.state);
      setPendingDrawOffer(false);

      if (data.move.isCheckmate) {
        soundManager.playGameOver();
      } else if (data.move.isCheck) {
        soundManager.playCheck();
      } else if (data.move.captured) {
        soundManager.playCapture();
      } else {
        soundManager.playMove();
      }
    });

    socket.on('game:moveRejected', (data) => {
      setErrorMessage(data.error);
      if (data.state) setRoomState(data.state);
    });

    socket.on('game:drawOffered', () => {
      setPendingDrawOffer(true);
    });

    socket.on('game:drawDeclined', () => {
      setPendingDrawOffer(false);
      alert('Draw offer declined');
    });

    socket.on('game:ended', (data) => {
      setRoomState(data.state);
      setPendingDrawOffer(false);
      soundManager.playGameOver();
    });

    socket.on('player:disconnected', (data) => {
      if (data.state) setRoomState(data.state);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (timeControl: TimeControl, playerName: string, preferredColor?: Color) => {
      return new Promise<string>((resolve, reject) => {
        if (!socketRef.current) return reject(new Error('No socket connection'));
        socketRef.current.emit(
          'room:create',
          { timeControl, playerName, preferredColor },
          (res: any) => {
            if (res.success && res.roomId) {
              resolve(res.roomId);
            } else {
              reject(new Error(res.error || 'Failed to create room'));
            }
          }
        );
      });
    },
    []
  );

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('No socket connection'));
      socketRef.current.emit('room:join', { roomId, playerName }, (res: any) => {
        if (res.success) {
          resolve();
        } else {
          reject(new Error(res.error || 'Failed to join room'));
        }
      });
    });
  }, []);

  const sendMove = useCallback((move: MoveInput) => {
    if (!socketRef.current || !roomState?.roomId) return;
    socketRef.current.emit('game:move', {
      roomId: roomState.roomId,
      move,
      clientTimestamp: Date.now(),
    });
  }, [roomState?.roomId]);

  const offerDraw = useCallback(() => {
    if (!socketRef.current || !roomState?.roomId) return;
    socketRef.current.emit('game:drawOffer', { roomId: roomState.roomId });
  }, [roomState?.roomId]);

  const respondDraw = useCallback((accept: boolean) => {
    if (!socketRef.current || !roomState?.roomId) return;
    socketRef.current.emit('game:drawResponse', { roomId: roomState.roomId, accept });
    setPendingDrawOffer(false);
  }, [roomState?.roomId]);

  const claimDraw = useCallback((type: 'threefold' | 'fifty_moves') => {
    if (!socketRef.current || !roomState?.roomId) return;
    socketRef.current.emit('game:claimDraw', { roomId: roomState.roomId, type });
  }, [roomState?.roomId]);

  const resign = useCallback(() => {
    if (!socketRef.current || !roomState?.roomId) return;
    socketRef.current.emit('game:resign', { roomId: roomState.roomId });
  }, [roomState?.roomId]);

  return {
    connected,
    roomState,
    playerColor,
    errorMessage,
    pendingDrawOffer,
    createRoom,
    joinRoom,
    sendMove,
    offerDraw,
    respondDraw,
    claimDraw,
    resign,
  };
}
