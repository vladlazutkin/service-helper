import { FIGURE_COLOR, FIGURE_NAME } from '../../../interfaces/games/chess';
import { CheckersBoard } from './CheckersBoard';
import { CheckersFigure } from './CheckersFigure';
import { CheckersCell } from './Cell';

export class Piece extends CheckersFigure {
  isQueen = false;

  constructor(name: FIGURE_NAME, color: FIGURE_COLOR, board: CheckersBoard) {
    super(name, color, board);
  }

  getBeatenCoordinates(
    cell: CheckersCell
  ): { found: false } | { found: true; i: number; j: number } {
    const signI = cell.i - this.currentCell?.i!;
    const signJ = cell.j - this.currentCell?.j!;

    const getResult = (
      newI: number,
      newJ: number
    ): { found: false } | { found: true; i: number; j: number } => {
      if (this.board.hasFigure(newI, newJ)) {
        return {
          found: true,
          i: newI,
          j: newJ,
        };
      }
      return {
        found: false,
      };
    };

    if (signI > 0 && signJ < 0) {
      let newI = this.currentCell?.i! + 1;
      let newJ = this.currentCell?.j! - 1;
      while (newI <= 7 && newJ >= 0) {
        const result = getResult(newI, newJ);
        if (result.found) {
          return result;
        }
        newI++;
        newJ--;
      }
    } else if (signI > 0 && signJ > 0) {
      let newI = this.currentCell?.i! + 1;
      let newJ = this.currentCell?.j! + 1;
      while (newI <= 7 && newJ <= 7) {
        const result = getResult(newI, newJ);
        if (result.found) {
          return result;
        }
        newI++;
        newJ++;
      }
    } else if (signI < 0 && signJ < 0) {
      let newI = this.currentCell?.i! - 1;
      let newJ = this.currentCell?.j! - 1;
      while (newI >= 0 && newJ >= 0) {
        const result = getResult(newI, newJ);
        if (result.found) {
          return result;
        }
        newI--;
        newJ--;
      }
    } else {
      let newI = this.currentCell?.i! - 1;
      let newJ = this.currentCell?.j! + 1;
      while (newI >= 0 && newJ <= 7) {
        const result = getResult(newI, newJ);
        if (result.found) {
          return result;
        }
        newI--;
        newJ++;
      }
    }
    return { found: false };
  }

  pieceIsQueen() {
    switch (this.color) {
      case FIGURE_COLOR.BLACK:
        return this.currentCell?.i === 7;
      case FIGURE_COLOR.WHITE:
        return this.currentCell?.i === 0;
    }
  }

  checkQueen() {
    if (this.pieceIsQueen() && !this.isQueen) {
      this.isQueen = true;
    }
  }

  move(cell: CheckersCell) {
    let isBeaten = false;

    if (this.canBeat(cell)) {
      isBeaten = true;

      const beatenData = this.getBeatenCoordinates(cell);
      if (!beatenData.found) {
        return;
      }
      const { i, j } = beatenData;
      const beatenFigure = this.board.getFigure(i, j)!;
      this.board.addBeatenFigure(beatenFigure);
      const beatenCell = beatenFigure.currentCell!;
      beatenCell.figure = null;
    }

    this.currentCell!.figure = null;
    cell.figure = this;
    this.currentCell = cell;

    // const { whiteWin, blackWin } = this.board.checkForWin();
    // if (whiteWin) {
    //   alert('White win');
    // }
    // if (blackWin) {
    //   alert('Black win');
    // }

    this.checkQueen();
    if (!isBeaten) {
      return this.board.update();
    }
    if (!this.canBeatSomething()) {
      return this.board.update();
    }
    this.board.update(false);
  }

  canBeatSomething() {
    return this.board
      .getCells()
      .filter((c) => c.figure?.color !== this.color)
      .find((c) => this.canBeat(c));
  }

  checkDiagonalQueen(
    signI: number,
    signJ: number,
    cell: CheckersCell,
    beat = false
  ) {
    let count = 0;

    const getResult = (newI: number, newJ: number) => {
      if (this.board.getFigure(newI, newJ)?.color === this.color) {
        return false;
      }
      if (this.board.hasFigure(newI, newJ)) {
        count++;
        if (count > 1) {
          return false;
        }
      }
      if (newI === cell.i && newJ === cell.j) {
        if (beat) {
          return count === 1;
        }
        return count === 0;
      }
      return null;
    };

    if (signI > 0 && signJ < 0) {
      let newI = this.currentCell?.i! + 1;
      let newJ = this.currentCell?.j! - 1;
      while (newI <= 7 && newJ >= 0) {
        const result = getResult(newI, newJ);
        if (result !== null) {
          return result;
        }
        newI++;
        newJ--;
      }
    } else if (signI > 0 && signJ > 0) {
      let newI = this.currentCell?.i! + 1;
      let newJ = this.currentCell?.j! + 1;
      while (newI <= 7 && newJ <= 7) {
        const result = getResult(newI, newJ);
        if (result !== null) {
          return result;
        }
        newI++;
        newJ++;
      }
    } else if (signI < 0 && signJ < 0) {
      let newI = this.currentCell?.i! - 1;
      let newJ = this.currentCell?.j! - 1;
      while (newI >= 0 && newJ >= 0) {
        const result = getResult(newI, newJ);
        if (result !== null) {
          return result;
        }
        newI--;
        newJ--;
      }
    } else {
      let newI = this.currentCell?.i! - 1;
      let newJ = this.currentCell?.j! + 1;
      while (newI >= 0 && newJ <= 7) {
        const result = getResult(newI, newJ);
        if (result !== null) {
          return result;
        }
        newI--;
        newJ++;
      }
    }
    return false;
  }

  canMove(cell: CheckersCell): boolean {
    if (cell.figure) {
      return false;
    }
    const signI = cell.i - this.currentCell?.i!;
    const signJ = cell.j - this.currentCell?.j!;
    if (this.isQueen) {
      return this.checkDiagonalQueen(signI, signJ, cell);
    }

    switch (this.color) {
      case FIGURE_COLOR.BLACK: {
        const newI = this.currentCell?.i! + 1;
        return (
          newI === cell.i &&
          [this.currentCell?.j! - 1, this.currentCell?.j! + 1].includes(cell.j)
        );
      }
      case FIGURE_COLOR.WHITE: {
        const newI = this.currentCell?.i! - 1;
        return (
          newI === cell.i &&
          [this.currentCell?.j! - 1, this.currentCell?.j! + 1].includes(cell.j)
        );
      }
    }
  }

  canBeat(cell: CheckersCell): boolean {
    if (cell.figure) {
      return false;
    }
    const signI = cell.i - this.currentCell?.i!;
    const signJ = cell.j - this.currentCell?.j!;

    if (this.isQueen) {
      return this.checkDiagonalQueen(signI, signJ, cell, true);
    }
    const curI = this.currentCell?.i!;
    const curJ = this.currentCell?.j!;
    if (curI - 2 === cell.i && curJ + 2 === cell.j) {
      return (
        this.board.hasFigure(curI - 1, curJ + 1) &&
        this.board.getFigure(curI - 1, curJ + 1)?.color !== this.color
      );
    }
    if (curI + 2 === cell.i && curJ + 2 === cell.j) {
      return (
        this.board.hasFigure(curI + 1, curJ + 1) &&
        this.board.getFigure(curI + 1, curJ + 1)?.color !== this.color
      );
    }
    if (curI - 2 === cell.i && curJ - 2 === cell.j) {
      return (
        this.board.hasFigure(curI - 1, curJ - 1) &&
        this.board.getFigure(curI - 1, curJ - 1)?.color !== this.color
      );
    }
    if (curI + 2 === cell.i && curJ - 2 === cell.j) {
      return (
        this.board.hasFigure(curI + 1, curJ - 1) &&
        this.board.getFigure(curI + 1, curJ - 1)?.color !== this.color
      );
    }
    return false;
  }
}
