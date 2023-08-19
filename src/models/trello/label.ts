import { Schema, model } from 'mongoose';
import { Board } from './board';
import { User } from '../user';
import { Column } from './column';

export interface Label {
  _id: string;
  title: string;
  color: string;
  board: Board;
  user: User;
}

const labelSchema = new Schema({
  title: { type: String, required: true },
  color: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  board: { ref: 'Board', type: Schema.Types.ObjectId },
});

export const LabelModel = model<Label>('Label', labelSchema);
