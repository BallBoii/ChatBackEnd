import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import { setupSocketHandlers } from './handlers/socketHandlers';
import { RouterManager } from '@/routes/RouteManager';
import { errorHandler } from '@/middlewares/errorHandler';
import { config } from '@/config/config';
import { startCleanupScheduler } from '@/utils/cleanup';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Connection settings for session-based chat
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({ 
  credentials: true, 
  origin: config.CORS_ORIGIN 
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
const routerManager = new RouterManager();
app.use(routerManager.getRouter());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    uptime: process.uptime(),
    service: 'GhostRooms Backend',
    version: '1.0.0'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Start cleanup scheduler
startCleanupScheduler();

async function startServer() {
  try {
    const PORT = config.PORT;
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('👻 ======================================');
      console.log(`   GhostRooms Server Started!!`);
      console.log('   ======================================');
      console.log(`   🚀 Server:      http://0.0.0.0:${PORT}`);
      console.log(`   ❤️  Health:      http://0.0.0.0:${PORT}/health`);
      console.log(`   🔌 WebSocket:   ws://0.0.0.0:${PORT}`);
      console.log(`   🌐 CORS Origin: ${config.CORS_ORIGIN}`);
      console.log(`   📦 Environment: ${config.NODE_ENV}`);
      console.log(`   ⏰ Room TTL:    ${config.ROOM_TTL_HOURS} hours`);
      console.log('   ======================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

export { io };

