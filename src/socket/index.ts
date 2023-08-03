import { Server } from 'socket.io';
import { createServer } from 'http';
import app from '../app';
import { logger } from '../logger';
import { initChess } from './games/chess';
import { initCheckers } from './games/checkers';

export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://service-helper-client.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  initChess(io, socket);
  initCheckers(io, socket);

  logger.info('Client connected');
});
