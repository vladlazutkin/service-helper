import { Schema, model } from 'mongoose';
import { User } from './user';
import { FIGURE_COLOR } from '../interfaces/games/chess';

export interface ChessGame {
  _id: string;
  playerWhite: User;
  playerBlack?: User;
  isAI: boolean;
  winner: FIGURE_COLOR;
  state: string;
  roomId: string;
}

const chessGameSchema = new Schema({
  playerWhite: { ref: 'User', type: Schema.Types.ObjectId, required: true },
  playerBlack: { ref: 'User', type: Schema.Types.ObjectId },
  winner: {
    type: String,
    enum: FIGURE_COLOR,
  },
  isAI: { type: Boolean, required: true },
  state: { type: String },
  roomId: { type: String },
});

export const ChessGameModel = model<ChessGame>('ChessGame', chessGameSchema);
