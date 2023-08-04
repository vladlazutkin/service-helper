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

io.use(async (socket, next) => {
  const token = socket.handshake.query?.token;

  if (token) {
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
  }
});

io.on('connection', (socket) => {
  initChess(io, socket as CustomSocket);
  initCheckers(io, socket as CustomSocket);

  logger.info('Client connected');
});
