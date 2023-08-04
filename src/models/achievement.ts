import { Schema, model } from 'mongoose';
import { User } from './user';
import { ACHIEVEMENT_EVENT } from '../interfaces/achievements';

export interface Achievement {
  _id: string;
  title: string;
  description: string;
  avatar: string;
  total: number;
  current: number;
  user: User;
  event: ACHIEVEMENT_EVENT;
}

const achievementSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  avatar: { type: String, required: true },
  total: { type: Number, required: true },
  current: { type: Number, default: 0 },
  event: { type: String, enum: ACHIEVEMENT_EVENT, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
});

export const AchievementModel = model<Achievement>(
  'Achievement',
  achievementSchema
);
