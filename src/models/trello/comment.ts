import { Schema, model } from 'mongoose';
import { Board } from './board';
import { User } from '../user';
import { Column } from './column';
import { Card } from './card';

export interface Comment {
  _id: string;
  text: string;
  board: Board;
  user: User;
  card: Card;
  column: Column;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema({
  text: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  column: { ref: 'Column', type: Schema.Types.ObjectId },
  card: { ref: 'Card', type: Schema.Types.ObjectId },
  board: { ref: 'Board', type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const CommentModel = model<Comment>('Comment', commentSchema);
