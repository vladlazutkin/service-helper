import { Schema, model } from 'mongoose';
import { User } from './user';
import { Dimensions, Range } from '../interfaces/Range';

export enum VideoRangeStatus {
  RECOGNIZING = 'recognizing',
  VIDEO_DOWNLOADED = 'video-downloaded',
  RECOGNIZED = 'recognized',
}

export interface SpotifyTrack {
  id: string;
  name: string;
  imageUrl: string;
  artistName: string;
  externalUrl: string;
  previewUrl: string;
}

export interface VideoRange {
  _id: string;
  date: Date;
  result: string[];
  user: User;
  range: Range;
  progress: number;
  dimensions: Dimensions;
  spotifyTracks: SpotifyTrack[];
  playlistUrl: string;
}

const videoRangeSchema = new Schema({
  status: {
    type: String,
    enum: VideoRangeStatus,
    default: VideoRangeStatus.RECOGNIZING,
  },
  video: { ref: 'Video', type: Schema.Types.ObjectId },
  result: [{ type: String, required: true }],
  progress: { type: Number },
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
  spotifyTracks: [
    {
      id: { type: String },
      name: { type: String },
      imageUrl: { type: String },
      artistName: { type: String },
      externalUrl: { type: String },
      previewUrl: { type: String },
    },
  ],
  playlistUrl: { type: String },
});

export const VideoRangeModel = model<VideoRange>(
  'VideoRange',
  videoRangeSchema
);
