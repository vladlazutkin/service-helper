import { Schema, model } from 'mongoose';
import { User } from './user';

export interface NotificationSubscription {
  _id: string;
  endpoint: string;
  expirationTime?: number;
  keys: {
    auth: string;
    p256dh: string;
  };
  user: User;
}

const notificationSubscriptionSchema = new Schema({
  user: { ref: 'User', type: Schema.Types.ObjectId },
  endpoint: { type: String, unique: true, required: true },
  expirationTime: { type: Number, required: false },
  keys: {
    auth: String,
    p256dh: String,
  },
});

export const NotificationSubscriptionModel = model<NotificationSubscription>(
  'NotificationSubscription',
  notificationSubscriptionSchema
);
