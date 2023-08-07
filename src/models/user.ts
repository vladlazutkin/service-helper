import { Schema, model } from 'mongoose';
import { ChessConfig } from './chess-config';
import { ChessSkin } from './chess-skin';

export interface User {
  _id: string;
  email: string;
  password: string;
  profileIcon: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  chessConfig?: ChessConfig;
  chessSkins?: ChessSkin[];
}

const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String },
  spotifyAccessToken: { type: String },
  profileIcon: { type: String },
  spotifyRefreshToken: { type: String },
  notes: [
    {
      ref: 'Note',
      type: Schema.Types.ObjectId,
    },
  ],
  chessSkins: [
    {
      ref: 'ChessSkin',
      type: Schema.Types.ObjectId,
    },
  ],
  chessConfig: {
    ref: 'ChessConfig',
    type: Schema.Types.ObjectId,
  },
});

export const UserModel = model<User>('User', userSchema);
