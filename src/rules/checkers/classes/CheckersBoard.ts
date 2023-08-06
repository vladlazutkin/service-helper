import { FIGURE_COLOR } from '../../../interfaces/games/chess';
import { CheckersCell } from './Cell';
import { CheckersFigure } from './CheckersFigure';
import { getRandomInt } from '../../../helpers/shared/getRandomInt';

export enum EVENT_TYPE {
  BECOME_QUEEN = 'BECOME_QUEEN',
}

interface Event {
  type: EVENT_TYPE;
  data?: Record<string, any>;
}

export class CheckersBoard {
  private cells: CheckersCell[][] = [];
  currentColor: FIGURE_COLOR;
  beatenFigures: CheckersFigure[] = [];
  private cbs: ((event: Event) => void)[] = [];

  constructor() {
    this.currentColor = FIGURE_COLOR.WHITE;
  }

  onBecomeQueen(color: FIGURE_COLOR) {
    this.cbs.forEach((cb) =>
      cb({ type: EVENT_TYPE.BECOME_QUEEN, data: { color } })
    );
  }

  onUpdate(cb: (event: Event) => void) {
    this.cbs.push(cb);
  }

  aiMove() {
    const cells = this.getCells().filter(
      (c) => c.figure && c.figure.color === this.currentColor
    );
    const possibleMoves = cells
      .map((c) => {
        const moves = this.getCells().filter((cc) => c.figure?.canMove(cc));
        const beats = this.getCells().filter((cc) => c.figure?.canBeat(cc));

        if (beats.length) {
          return { cell: c, moves: beats };
        }
        return { cell: c, moves: [...moves, ...beats] };
      })
      .filter((c) => c.moves.length);
    const randomCell = possibleMoves[getRandomInt(0, possibleMoves.length - 1)];
    const actions = randomCell.moves;
    const randomActionCell = actions[getRandomInt(0, actions.length - 1)];

    return {
      from: { i: randomCell.cell.i, j: randomCell.cell.j },
      to: { i: randomActionCell.i, j: randomActionCell.j },
    };
  }

  renderBoard() {
    for (let i = 0; i < 8; i++) {
      let str = '';
      for (let j = 0; j < 8; j++) {
        const figure = this.cells[i][j].figure;
        str += !figure
          ? '| |'
          : figure.color === FIGURE_COLOR.WHITE
          ? '|w|'
          : '|b|';
      }
      console.log(str);
    }
    console.log();
  }

  move(from: { i: number; j: number }, to: { i: number; j: number }) {
    const figure = this.getFigure(from.i, from.j);
    const toCell = this.getCell(to.i, to.j);
    return figure?.moveTo(toCell);
  }

  getCells() {
    return this.cells.flat();
  }

  getCell(i: number, j: number) {
    return this.cells[i][j];
  }

  hasFigure(i: number, j: number) {
    return !!this.cells[i] && !!this.cells[i][j] && !!this.cells[i][j].figure;
  }

  getFigure(i: number, j: number) {
    if (!this.hasFigure(i, j)) {
      return null;
    }
    return this.cells[i][j].figure;
  }

  addBeatenFigure(figure: CheckersFigure) {
    this.beatenFigures.push(figure);
  }

  initCells() {
    for (let i = 0; i < 8; i++) {
      this.cells.push([]);
      for (let j = 0; j < 8; j++) {
        const cell = new CheckersCell(i, j);
        this.cells[i].push(cell);
      }
    }
  }

  checkForWin() {
    const whiteWin = !this.getCells().find(
      (c) => c.figure?.color === FIGURE_COLOR.BLACK
    );
    const blackWin = !this.getCells().find(
      (c) => c.figure?.color === FIGURE_COLOR.WHITE
    );

    return { whiteWin, blackWin };
  }

  update(changeColor = true) {
    if (changeColor) {
      this.currentColor =
        this.currentColor === FIGURE_COLOR.WHITE
          ? FIGURE_COLOR.BLACK
          : FIGURE_COLOR.WHITE;
    }
  }
}
