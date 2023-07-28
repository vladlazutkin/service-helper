import { Server, Socket } from 'socket.io';
import { FIGURE_COLOR, Game, Room } from '../../interfaces/games/chess';
import { v4 as uuidv4 } from 'uuid';
const jsChessEngine = require('js-chess-engine');

let rooms: Room[] = [];

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

export const initChess = (io: Server, socket: Socket) => {
  let room: Room;
  let game: Game;
  let config: any;

  socket.on('init-chess', () => {
    config = getConfig();
    game = new jsChessEngine.Game(config);
    const lastRoom = rooms[rooms.length - 1];

    if (lastRoom && !lastRoom.black) {
      lastRoom.black = socket.id;
      room = lastRoom;
      socket.emit('chess-connect', { color: FIGURE_COLOR.BLACK });
    } else {
      const newRoom = { roomId: uuidv4(), white: socket.id, black: null, game };
      rooms.push(newRoom);
      room = newRoom;
      socket.emit('chess-connect', { color: FIGURE_COLOR.WHITE });
    }

    socket.join(room.roomId);
  });

  socket.on('chess-move', (data) => {
    try {
      const from = cellMap(data.from.i, data.from.j);
      const to = cellMap(data.to.i, data.to.j);

      game.move(
        `${from.letter.toUpperCase()}${from.num}`,
        `${to.letter.toUpperCase()}${to.num}`
      );

      io.to(room.roomId).emit('chess-move', data);

      // No black player - AI
      if (!room.black) {
        setTimeout(() => {
          const move = game.aiMove(0);
          const [fromMove] = Object.keys(move);
          const toMove = move[fromMove];

          io.to(room.roomId).emit('chess-move', {
            from: revertMap(fromMove),
            to: revertMap(toMove),
          });
        }, 1500);
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

const getConfig = () => {
  return {
    fullMove: 1,
    halfMove: 0,
    enPassant: null,
    isFinished: false,
    checkMate: false,
    check: false,
    turn: 'white',
    pieces: {
      E1: 'K',
      D1: 'Q',
      A1: 'R',
      H1: 'R',
      C1: 'B',
      F1: 'B',
      B1: 'N',
      G1: 'N',
      A2: 'P',
      B2: 'P',
      C2: 'P',
      D2: 'P',
      E2: 'P',
      F2: 'P',
      G2: 'P',
      H2: 'P',
      E8: 'k',
      D8: 'q',
      A8: 'r',
      H8: 'r',
      C8: 'b',
      F8: 'b',
      B8: 'n',
      G8: 'n',
      A7: 'p',
      B7: 'p',
      C7: 'p',
      D7: 'p',
      E7: 'p',
      F7: 'p',
      G7: 'p',
      H7: 'p',
    },
    castling: {
      whiteShort: false,
      blackShort: false,
      whiteLong: false,
      blackLong: false,
    },
  };
};
