import { Server } from 'socket.io';
import { createServer } from 'http';
import app from '../app';

export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', () => {
  console.log('Client connected');
});
