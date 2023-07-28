export enum FIGURE_COLOR {
  'WHITE' = 'WHITE',
  'BLACK' = 'BLACK',
}

export interface Room {
  roomId: string;
  white: string;
  black: string | null;
  game: Game;
}

export interface Game {
  move: (from: string, to: string) => void;
  aiMove: (depth: number) => Record<string, string>;
}
