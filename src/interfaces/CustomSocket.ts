import { User } from '../models/user';
import { Socket } from 'socket.io';

export interface CustomSocket extends Socket {
  user: Omit<User, 'password'>;
}
