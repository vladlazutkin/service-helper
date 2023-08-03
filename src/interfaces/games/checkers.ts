import { CheckersBoard } from '../../rules/checkers/classes/CheckersBoard';

export interface CheckersRoom {
  roomId: string;
  white: string;
  black: string | null;
  board: CheckersBoard | null;
  isAI: boolean;
}
