import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { RoomManager } from './game/RoomManager.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';
import { isAllowedOrigin } from './security/origin.js';
import { DataStore } from './auth/dataStore.js';
import { TokenService } from './auth/tokens.js';
import { createAuthRouter, ensureSuperAdmin } from './auth/authRouter.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

export function createServer() {
  const app = express();
  app.disable('x-powered-by');

  // Security Headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // CORS restricted to allowed origins (LAN / localhost / configured origins)
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not an allowed origin'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));

  const server = http.createServer(app);

  const io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not permitted by socket policy'));
        }
      },
      methods: ['GET', 'POST'],
    },
  });

  const roomManager = new RoomManager();
  const dataStore = new DataStore(DATA_DIR);
  const tokenService = new TokenService(dataStore.getAuthSecret());

  // Initialize Super Admin account if not present
  ensureSuperAdmin(dataStore).catch((err) => {
    console.error('[ChessServer] Error setting up super admin:', err);
  });

  // Socket handlers with rate limiting & error containment
  const { sweep: sweepSockets } = setupSocketHandlers(io, roomManager);

  // Authentication & Management API
  const { router: authRouter, sweep: sweepAuth } = createAuthRouter(dataStore, tokenService);
  app.use('/api', authRouter);

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: roomManager.getActiveRoomCount(),
      timestamp: Date.now(),
    });
  });

  // LAN network detection
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

  // Public room info - does NOT expose internal socket IDs or playerKeys
  app.get('/api/rooms/:id', (req, res) => {
    const room = roomManager.getRoom(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json(room.getPublicState());
  });

  // Periodic maintenance
  const sweepInterval = setInterval(() => {
    roomManager.sweep();
    sweepSockets();
    sweepAuth();
  }, 60_000);

  server.on('close', () => {
    clearInterval(sweepInterval);
  });

  return { app, server, io, roomManager, dataStore };
}

// Global safety net for unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[ChessServer] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ChessServer] Unhandled Rejection:', reason);
});

// Start standalone if executed directly
if (process.env.NODE_ENV !== 'test') {
  const { server } = createServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChessServer] Real-time authoritative server listening on 0.0.0.0:${PORT}`);
  });
}
