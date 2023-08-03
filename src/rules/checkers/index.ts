import { FIGURE_COLOR, FIGURE_NAME } from '../../interfaces/games/chess';
import { Piece } from './classes/Piece';
import { CheckersBoard } from './classes/CheckersBoard';

export const initCheckersBoard = () => {
  const board = new CheckersBoard();

  board.initCells();

  for (let j = 0; j < 8; j += 2) {
    board
      .getCell(5, j)
      .setFigure(new Piece(FIGURE_NAME.PIECE, FIGURE_COLOR.WHITE, board));
    board
      .getCell(6, j + 1)
      .setFigure(new Piece(FIGURE_NAME.PIECE, FIGURE_COLOR.WHITE, board));
    board
      .getCell(7, j)
      .setFigure(new Piece(FIGURE_NAME.PIECE, FIGURE_COLOR.WHITE, board));
  }
  for (let j = 0; j < 8; j += 2) {
    board
      .getCell(0, j + 1)
      .setFigure(new Piece(FIGURE_NAME.PIECE, FIGURE_COLOR.BLACK, board));
    board
      .getCell(1, j)
      .setFigure(new Piece(FIGURE_NAME.PIECE, FIGURE_COLOR.BLACK, board));
    board
      .getCell(2, j + 1)
      .setFigure(new Piece(FIGURE_NAME.PIECE, FIGURE_COLOR.BLACK, board));
  }

  return board;
};
