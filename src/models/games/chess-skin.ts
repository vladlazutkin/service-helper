import { Schema, model } from 'mongoose';

export interface ChessSkin {
  _id: string;
  title: string;
  config: string;
  price: number;
}

const chessSkinSchema = new Schema({
  title: { type: String, required: true },
  config: { type: String, required: true },
  price: { type: Number, required: true },
});

export const ChessSkinModel = model<ChessSkin>('ChessSkin', chessSkinSchema);
