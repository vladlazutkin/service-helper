import { Schema, model } from 'mongoose';
import { User } from './user';
import { VideoRange } from './video-range';

export enum VIDEO_STATUS {
  LOADING = 'loading',
  LOADED = 'loaded',
}

export interface Video {
  _id: string;
  date: Date;
  url: string;
  youtubeUrl: string;
  status: VIDEO_STATUS;
  user: User;
  videoRanges: VideoRange[];
}

const videoSchema = new Schema({
  date: { type: Date, default: Date.now },
  status: { type: String, enum: VIDEO_STATUS, default: VIDEO_STATUS.LOADING },
  url: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  videoRanges: [{ ref: 'VideoRange', type: Schema.Types.ObjectId }],
});

export const VideoModel = model<Video>('Video', videoSchema);
