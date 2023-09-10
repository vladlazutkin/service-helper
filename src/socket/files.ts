import { Server } from 'socket.io';
import { CustomSocket } from '../interfaces/CustomSocket';

let desktopSockets: CustomSocket[] = [];
let clientSockets: CustomSocket[] = [];

export const initFiles = (io: Server, socket: CustomSocket) => {
  if (socket.isDesktop) {
    desktopSockets.push(socket);

    socket.on('disconnect', () => {
      desktopSockets = desktopSockets.filter((s) => s !== socket);
    });
  } else {
    clientSockets.push(socket);

    socket.on('disconnect', () => {
      clientSockets = clientSockets.filter((s) => s !== socket);
    });
  }

  socket.on('exec-file-path', (data) => {
    const desktopSocket = desktopSockets.find(
      (s) => s.isDesktop && s.user._id.toString() === socket.user._id.toString()
    );
    if (!desktopSocket) {
      return socket.emit('desktop-not-connected');
    }
    desktopSocket.emit('exec-file', data);
  });

  socket.on('exec-error', (data) => {
    const clientSocket = clientSockets.find(
      (s) =>
        !s.isDesktop && s.user._id.toString() === socket.user._id.toString()
    );
    if (!clientSocket) {
      return socket.emit('client-not-connected');
    }
    clientSocket.emit('exec-error-message', data);
  });

  socket.on('exec-success', (data) => {
    const clientSocket = clientSockets.find(
      (s) =>
        !s.isDesktop && s.user._id.toString() === socket.user._id.toString()
    );
    if (!clientSocket) {
      return socket.emit('client-not-connected');
    }
    clientSocket.emit('exec-success-message', data);
  });
};
