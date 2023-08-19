import { ChessSkin } from '../models/games/chess-skin';

enum FIGURE {
  WHITE_PAWN = 'P',
  WHITE_KNIGHT = 'N',
  WHITE_BISHOP = 'B',
  WHITE_ROOK = 'R',
  WHITE_QUEEN = 'Q',
  WHITE_KING = 'K',
  BLACK_PAWN = 'p',
  BLACK_KNIGHT = 'n',
  BLACK_BISHOP = 'b',
  BLACK_ROOK = 'r',
  BLACK_QUEEN = 'q',
  BLACK_KING = 'k',
}

export const chessSkins: Omit<ChessSkin, '_id'>[] = [
  {
    title: 'Rainbow',
    price: 5,
    config: JSON.stringify({
      [FIGURE.WHITE_KING]: 'skins/rainbow_king.png',
    }),
  },
  {
    title: 'Pink',
    price: 3,
    config: JSON.stringify({
      [FIGURE.WHITE_KNIGHT]: 'skins/pink_knight.png',
    }),
  },
];
