import { Schema, model } from 'mongoose';
import { User } from './user';
import { Dimensions, Range } from '../interfaces/Range';

export enum VideoRangeStatus {
  RECOGNIZING = 'recognizing',
  RECOGNIZED = 'recognized',
}

export interface VideoRange {
  _id: string;
  date: Date;
  result: string[];
  user: User;
  range: Range;
  dimensions: Dimensions;
}

const videoRangeSchema = new Schema({
  status: {
    type: String,
    enum: VideoRangeStatus,
    default: VideoRangeStatus.RECOGNIZING,
  },
  video: { ref: 'Video', type: Schema.Types.ObjectId },
  result: [{ type: String, required: true }],
  range: {
    id: { type: String },
    start: { type: Number },
    stop: { type: Number },
  },
  dimensions: {
    left: { type: Number },
    top: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
});

export const VideoRangeModel = model<VideoRange>(
  'VideoRange',
  videoRangeSchema
);
