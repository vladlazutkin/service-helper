import { Server, Socket } from 'socket.io';
import { FIGURE_COLOR } from '../../interfaces/games/chess';
import { v4 as uuidv4 } from 'uuid';
import { CheckersRoom } from '../../interfaces/games/checkers';
import { CheckersBoard } from '../../rules/checkers/classes/CheckersBoard';
import { initCheckersBoard } from '../../rules/checkers';
import { wait } from '../../helpers/shared/wait';
import { CustomSocket } from '../../interfaces/CustomSocket';
import AchievementsHandler from '../../handlers/achievements-handler';

let rooms: CheckersRoom[] = [];

const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const cellMap = (i: number, j: number) => {
  const num = 8 - i;
  const letter = letters[j].toUpperCase();

  return {
    num,
    letter,
  };
};

export const revertMap = (from: string) => {
  const [letterFrom, numFrom] = from;

  const i = 8 - +numFrom;
  const j = letters.indexOf(letterFrom.toLowerCase());

  return {
    i,
    j,
  };
};

export const initCheckers = (io: Server, socket: CustomSocket) => {
  let room: CheckersRoom;
  let board: CheckersBoard;
  let color: string;

  const createCheckersRoom = (isAI: boolean) => {
    const lastRoom = rooms[rooms.length - 1];

    if (lastRoom && !lastRoom.black && !lastRoom.isAI) {
      lastRoom.black = socket.id;
      room = lastRoom;
      board = lastRoom.board!;
      color = 'black';
      socket.emit('checkers-connect', { color: FIGURE_COLOR.BLACK });
    } else {
      board = initCheckersBoard();
      const newRoom = {
        roomId: uuidv4(),
        white: socket.id,
        black: null,
        board,
        isAI,
      };
      board.renderBoard();
      rooms.push(newRoom);
      room = newRoom;
      color = 'white';
      socket.emit('checkers-connect', { color: FIGURE_COLOR.WHITE });
    }

    socket.join(room.roomId);
  };

  socket.on('init-checkers-ai', () => {
    createCheckersRoom(true);
  });

  socket.on('init-checkers', () => {
    createCheckersRoom(false);
  });

  socket.on('checkers-move', async (data) => {
    try {
      const prevColor = board.currentColor;
      const res = board.move(data.from, data.to);
      board.renderBoard();

      AchievementsHandler.onCheckersMove(socket.user._id);

      io.to(room.roomId).emit('checkers-move', data);

      if (res === false) {
        console.log('illegal move', JSON.stringify(data));
      }
      // AI
      if (prevColor !== board.currentColor && room.isAI && res !== false) {
        const prevColorOpponent = board.currentColor;

        let count = 0;
        while (prevColorOpponent === board.currentColor && count < 5) {
          count++;
          await wait(1000);
          const move = board.aiMove();
          board.move(move.from, move.to);

          io.to(room.roomId).emit('checkers-move', {
            from: move.from,
            to: move.to,
          });
        }
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    if (!room) {
      console.log('no room');
      return;
    }
    if (room.white === socket.id) {
      if (room.black) {
        console.log('disconnect black');
        const socketBlack = io.sockets.sockets.get(room.black);
        if (socketBlack) {
          socketBlack.disconnect();
        }
      }
    } else {
      if (room.white) {
        console.log('disconnect white');
        const socketWhite = io.sockets.sockets.get(room.white);
        if (socketWhite) {
          socketWhite.disconnect();
        }
      }
    }
    rooms = rooms.filter((r) => r.roomId !== room.roomId);
  });
};
