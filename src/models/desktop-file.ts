import { Schema, model } from 'mongoose';
import { User } from './user';

export interface DesktopFile {
  _id: string;
  name: Date;
  path: string;
  user: User;
}

const desktopFileSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
});

export const DesktopFileModel = model<DesktopFile>(
  'DesktopFile',
  desktopFileSchema
);
