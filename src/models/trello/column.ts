import { Schema, model } from 'mongoose';
import { Board } from './board';
import { User } from '../user';
import { Card } from './card';

export interface Column {
  _id: string;
  title: string;
  position: number;
  board: Board;
  user: User;
  cards: Card[];
}

const columnSchema = new Schema({
  title: { type: String, required: true },
  position: { type: Number, required: true },
  board: { ref: 'Board', type: Schema.Types.ObjectId },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  cards: [{ ref: 'Card', type: Schema.Types.ObjectId }],
});

export const ColumnModel = model<Column>('Column', columnSchema);
