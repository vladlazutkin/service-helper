import mongoose from 'mongoose';
import { logger } from '../logger';

export const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGO_DB_CONNECT_URL!).then(() => {
    logger.debug('Connected to Database Successfully');
  });
};
