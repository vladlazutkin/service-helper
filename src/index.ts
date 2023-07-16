import app from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDatabase } from './databse';
import { logger } from './logger';
require('dotenv').config();

const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', () => {});

const port = process.env.PORT || 5000;

server.listen(port, () => {
  connectDatabase();
  logger.debug(`Listening: http://localhost:${port}`);
});
