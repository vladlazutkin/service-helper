import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import app from '../app';
import { logger } from '../logger';
import { FIGURE_COLOR } from '../interfaces/games/chess';

export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const rooms: { roomId: string; white: string; black: string | null }[] = [];

io.on('connection', (socket) => {
  const lastRoom = rooms[rooms.length - 1];
  let roomId = '';
  if (!lastRoom) {
    roomId = uuidv4();
    const newRoom = { roomId, white: socket.id, black: null };
    rooms.push(newRoom);
    socket.emit('chess-color', FIGURE_COLOR.WHITE);
  } else if (!lastRoom.black) {
    roomId = lastRoom.roomId;
    lastRoom.black = socket.id;
    socket.emit('chess-color', FIGURE_COLOR.BLACK);
  } else {
    roomId = uuidv4();
    const newRoom = { roomId, white: socket.id, black: null };
    rooms.push(newRoom);
    socket.emit('chess-color', FIGURE_COLOR.WHITE);
  }
  socket.join(roomId);

  socket.on('chess-move', (data) => {
    console.log('chess event');
    io.to(roomId).emit('chess-move', data);
  });

  logger.info('Client connected');
});
