export enum FIGURE_COLOR {
  'WHITE' = 'WHITE',
  'BLACK' = 'BLACK',
}

export enum FIGURE_NAME {
  'PAWN' = 'PAWN',
  'BISHOP' = 'BISHOP',
  'KNIGHT' = 'KNIGHT',
  'ROOK' = 'ROOK',
  'QUEEN' = 'QUEEN',
  'KING' = 'KING',
  'PIECE' = 'PIECE',
}

export interface Room {
  roomId: string;
  white: string;
  black: string | null;
  game: Game | null;
  isAI: boolean;
}

export interface Game {
  move: (from: string, to: string) => void;
  aiMove: (depth: number) => Record<string, string>;
}
