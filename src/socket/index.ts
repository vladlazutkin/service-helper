import { Server } from 'socket.io';
import { createServer } from 'http';
import app from '../app';
import { logger } from '../logger';
import { initChess } from './games/chess';
import { initCheckers } from './games/checkers';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/JwtPayload';
import { UserModel } from '../models/user';
import { CustomSocket } from '../interfaces/CustomSocket';
import { initFiles } from './files';
import { initRezka } from './rezka';

export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://service-helper-client.vercel.app',
      'https://shelp.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  const token = socket.handshake.query?.token;
  (socket as CustomSocket).isDesktop = !!socket.handshake.query?.isDesktop;

  if (!token) {
    return next();
  }

  try {
    jwt.verify(
      token as string,
      process.env.TOKEN_SECRET!,
      async (err, userData) => {
        if (err) {
          return next();
        }

        const { id } = userData as JwtPayload;
        const user = (await UserModel.findById(id))?.toObject();
        if (!user) {
          return next();
        }
        const { password, ...data } = user;
        (socket as CustomSocket).user = data;

        socket.join(user._id);

        next();
      }
    );
  } catch (e) {
    console.log(e);
  }
});

io.on('connection', (socket) => {
  const customSocket = socket as CustomSocket;
  if (customSocket.user) {
    initChess(io, customSocket);
    initCheckers(io, customSocket);
    initFiles(io, customSocket);
  }
  initRezka(io, customSocket);

  logger.info('Client connected');
});
