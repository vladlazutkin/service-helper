import { Schema, model } from 'mongoose';

export interface RezkaData {
  _id: string;
  key: string;
  data: string;
}

const rezkaDataSchema = new Schema({
  data: { type: String, required: true },
  key: { type: String, required: true },
});

export const RezkaDataModel = model<RezkaData>('RezkaData', rezkaDataSchema);
