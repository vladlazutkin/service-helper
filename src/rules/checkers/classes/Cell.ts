import { CheckersFigure } from './CheckersFigure';

export class CheckersCell {
  i: number;
  j: number;
  figure: CheckersFigure | null = null;

  constructor(i: number, j: number) {
    this.i = i;
    this.j = j;
  }

  setFigure(figure: CheckersFigure) {
    this.figure = figure;
    figure.currentCell = this;
  }
}
