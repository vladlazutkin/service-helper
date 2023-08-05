import { Server } from 'socket.io';
import { FIGURE_COLOR, Game, Room } from '../../interfaces/games/chess';
import { v4 as uuidv4 } from 'uuid';
import AchievementsHandler from '../../handlers/achievements-handler';
import { CustomSocket } from '../../interfaces/CustomSocket';
import { ChessGameModel } from '../../models/chess-game';
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

export const initChess = (io: Server, socket: CustomSocket) => {
  let room: Room;
  let game: Game;
  let config: any;
  let color: string;

  const createRoom = async (
    isAI: boolean,
    params: { initNewGame?: boolean; gameId?: string }
  ) => {
    config = getConfig();
    game = new jsChessEngine.Game(config);
    const lastRoom = rooms[rooms.length - 1];
    const { initNewGame = false, gameId } = params;

    if (lastRoom && !lastRoom.black && !lastRoom.isAI) {
      lastRoom.black = socket.id;
      await ChessGameModel.findByIdAndUpdate(lastRoom.gameId, {
        blackPlayer: socket.user._id,
      });
      room = lastRoom;
      color = 'black';
      socket.emit('chess-connect', { color: FIGURE_COLOR.BLACK });
    } else {
      const prevGame = gameId
        ? await ChessGameModel.findById(gameId)
        : await ChessGameModel.findOne({
            winner: { $exists: false },
            playerWhite: socket.user._id,
            isAI,
          });

      if (prevGame && !initNewGame) {
        if (prevGame.state) {
          game = new jsChessEngine.Game(JSON.parse(prevGame.state));
        }
        const newRoom: Room = {
          roomId: uuidv4(),
          white: socket.id,
          black: null,
          game,
          isAI,
          gameId: prevGame._id,
        };
        await ChessGameModel.findByIdAndUpdate(prevGame._id, {
          roomId: newRoom.roomId,
        });
        rooms.push(newRoom);
        room = newRoom;
      } else {
        const newRoom: Room = {
          roomId: uuidv4(),
          white: socket.id,
          black: null,
          game,
          isAI,
        };
        const chessGame = await ChessGameModel.create({
          playerWhite: socket.user._id,
          isAI,
          roomId: newRoom.roomId,
        });
        newRoom.gameId = chessGame._id;
        rooms.push(newRoom);
        room = newRoom;
      }

      color = 'white';
      socket.emit('chess-connect', {
        color: FIGURE_COLOR.WHITE,
        pieces: game.exportJson().pieces,
      });
    }

    socket.join(room.roomId);
  };

  socket.on('init-chess-ai', (data) => {
    createRoom(true, data);
  });

  socket.on('init-chess', (data) => {
    createRoom(false, data);
  });

  socket.on('chess-move', (data) => {
    try {
      game.printToConsole();
      const deep = data.deep ?? 0;

      AchievementsHandler.onChessMove(socket.user._id);

      if (room.isAI) {
        const from = cellMap(data.from.i, data.from.j);
        const to = cellMap(data.to.i, data.to.j);

        game.move(
          `${from.letter.toUpperCase()}${from.num}`,
          `${to.letter.toUpperCase()}${to.num}`
        );

        ChessGameModel.findByIdAndUpdate(room.gameId, {
          state: JSON.stringify(game.exportJson()),
        }).exec();
      }

      io.to(room.roomId).emit('chess-move', data);

      // AI
      if (room.isAI) {
        setTimeout(
          async () => {
            const move = game.aiMove(deep ?? 0);

            ChessGameModel.findByIdAndUpdate(room.gameId, {
              state: JSON.stringify(game.exportJson()),
            }).exec();

            const [fromMove] = Object.keys(move);
            const toMove = move[fromMove];

            io.to(room.roomId).emit('chess-move', {
              from: revertMap(fromMove),
              to: revertMap(toMove),
            });
          },
          deep < 3 ? 1500 : 0
        );
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
    // if (room.white === socket.id) {
    //   if (room.black) {
    //     console.log('disconnect black');
    //     const socketBlack = io.sockets.sockets.get(room.black);
    //     if (socketBlack) {
    //       socketBlack.disconnect();
    //     }
    //   }
    // } else {
    //   if (room.white) {
    //     console.log('disconnect white');
    //     const socketWhite = io.sockets.sockets.get(room.white);
    //     if (socketWhite) {
    //       socketWhite.disconnect();
    //     }
    //   }
    // }
    // rooms = rooms.filter((r) => r.roomId !== room.roomId);
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
