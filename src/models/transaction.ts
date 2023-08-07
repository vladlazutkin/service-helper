import { Schema, model } from 'mongoose';
import { User } from './user';

export enum TRANSACTION_STATUS {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  PENDING = 'ERROR',
}

export enum TRANSACTION_TYPE {
  CHESS_SKIN = 'CHESS_SKIN',
  CHECKERS_SKIN = 'CHECKERS_SKIN',
}

export interface Transaction {
  _id: string;
  sessionId: string;
  type: TRANSACTION_TYPE;
  additionalData?: string;
  status: TRANSACTION_STATUS;
  user: User;
  createdAt: Date;
}

const transactionSchema = new Schema({
  sessionId: { type: String, required: true },
  status: {
    type: String,
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PENDING,
  },
  additionalData: {
    type: String,
  },
  type: {
    type: String,
    enum: TRANSACTION_TYPE,
    required: true,
  },
  user: { ref: 'User', type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

export const TransactionModel = model<Transaction>(
  'Transaction',
  transactionSchema
);
