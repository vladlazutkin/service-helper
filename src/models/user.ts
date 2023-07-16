import { Schema, model } from 'mongoose';

export interface User {
  _id: string;
  email: string;
  password: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
}

const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  spotifyAccessToken: { type: String },
  spotifyRefreshToken: { type: String },
  notes: [
    {
      ref: 'Note',
      type: Schema.Types.ObjectId,
    },
  ],
});

export const UserModel = model<User>('User', userSchema);
