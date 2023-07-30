import { Schema, model } from 'mongoose';
import { User } from './user';

export interface Note {
  _id: string;
  date: Date;
  text: string;
  user: User;
}

const noteSchema = new Schema({
  text: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

noteSchema.pre('findOneAndUpdate', function (next) {
  // @ts-ignore
  this['updatedAt'] = Date.now();
  next();
});

export const NoteModel = model<Note>('Note', noteSchema);
