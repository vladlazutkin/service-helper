import { FIGURE_COLOR, FIGURE_NAME } from '../../../interfaces/games/chess';
import { CheckersCell } from './Cell';
import { CheckersBoard } from './CheckersBoard';

export class CheckersFigure {
  name: FIGURE_NAME;
  color: FIGURE_COLOR;
  board: CheckersBoard;
  currentCell: CheckersCell | null = null;

  constructor(name: FIGURE_NAME, color: FIGURE_COLOR, board: CheckersBoard) {
    this.name = name;
    this.color = color;
    this.board = board;
  }

  canBeat(cell: CheckersCell) {
    return true;
  }

  canMove(cell: CheckersCell) {
    return true;
  }

  move(cell: CheckersCell) {
    this.currentCell!.figure = null;
    if (cell.figure) {
      this.board.addBeatenFigure(cell.figure);
    }
    cell.figure = this;
    this.currentCell = cell;
    this.board.update();
    this.onMove();
  }

  isLegalMove(cell: CheckersCell) {
    if (this.board.currentColor !== this.color) {
      console.log('not your turn');
      return false;
    }
    if (cell.figure) {
      console.log('has figure');
      return false;
    }
    return this.canMove(cell) || this.canBeat(cell);
  }

  moveTo(cell: CheckersCell) {
    if (!this.isLegalMove(cell)) {
      return false;
    }

    this.move(cell);
  }

  onMove() {}
}
