import { Schema, model } from 'mongoose';
import { Board } from './board';
import { User } from '../user';
import { Column } from './column';
import { Label } from './label';

export interface Card {
  _id: string;
  title: string;
  description: string;
  position: number;
  coordinates: {
    x: number;
    y: number;
  };
  to: string[];
  board: Board;
  user: User;
  column: Column;
  labels: Label[];
}

const cardSchema = new Schema({
  title: { type: String, required: true },
  to: [{ type: String }],
  description: { type: String },
  position: { type: Number, default: 0 },
  coordinates: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  column: { ref: 'Column', type: Schema.Types.ObjectId },
  board: { ref: 'Board', type: Schema.Types.ObjectId },
  labels: [{ ref: 'Label', type: Schema.Types.ObjectId }],
});

export const CardModel = model<Card>('Card', cardSchema);
