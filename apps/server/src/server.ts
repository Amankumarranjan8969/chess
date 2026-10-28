import http from 'node:http';
import os from 'node:os';
import express from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { RoomManager } from './game/RoomManager.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const roomManager = new RoomManager();

  // Socket handlers
  setupSocketHandlers(io, roomManager);

  // REST endpoints
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: roomManager.getActiveRoomCount(),
      timestamp: Date.now(),
    });
  });

  app.get('/api/network-info', (_req, res) => {
    const nets = os.networkInterfaces();
    const addresses: string[] = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
          addresses.push(net.address);
        }
      }
    }
    res.json({
      lanIp: addresses[0] || 'localhost',
      addresses,
      webPort: 3000,
      serverPort: PORT,
    });
  });

  app.get('/api/rooms/:id', (req, res) => {
    const room = roomManager.getRoom(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json(room.getSerializedState());
  });

  return { app, server, io, roomManager };
}

// Start standalone if executed directly
if (process.env.NODE_ENV !== 'test') {
  const { server } = createServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChessServer] Real-time authoritative server listening on 0.0.0.0:${PORT}`);
  });
}
