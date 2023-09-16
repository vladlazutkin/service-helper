import { Server } from 'socket.io';
import { CustomSocket } from '../interfaces/CustomSocket';

export const initRezka = (io: Server, socket: CustomSocket) => {
  socket.on('pick-data', (data) => {
    io.emit('get-data', data);
  });
};
