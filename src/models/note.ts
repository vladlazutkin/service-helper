import { Schema, model } from 'mongoose';
import { User } from './user';

export interface Note {
  _id: string;
  date: Date;
  text: string;
  user: User;
}

const noteSchema = new Schema({
  date: { type: Date, default: Date.now },
  text: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
});

export const NoteModel = model<Note>('Note', noteSchema);
