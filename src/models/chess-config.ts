import { Schema, model } from 'mongoose';
import { User } from './user';
import { ChessSkin } from './chess-skin';

export interface ChessConfig {
  _id: string;
  user: User;
  config: string;
  chessSkin?: ChessSkin;
}

const chessConfigSchema = new Schema({
  config: { type: String },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  chessSkin: { ref: 'ChessSkin', type: Schema.Types.ObjectId },
});

export const ChessConfigModel = model<ChessConfig>(
  'ChessConfig',
  chessConfigSchema
);
