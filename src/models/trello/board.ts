import { Schema, model } from 'mongoose';
import { User } from '../user';
import { Column } from './column';
import { Label } from './label';

export interface Board {
  _id: string;
  title: string;
  gridStep: number;
  user: User;
  columns: Column[];
  labels: Label[];
}

const boardSchema = new Schema({
  title: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  gridStep: { type: Number, default: 200 },
  columns: [{ ref: 'Column', type: Schema.Types.ObjectId }],
  labels: [{ ref: 'Label', type: Schema.Types.ObjectId }],
});

export const BoardModel = model<Board>('Board', boardSchema);
