import mongoose from 'mongoose';

import { env } from '../config/env';

export const connectToDatabase = async (uri = env.MONGODB_URI): Promise<void> => {
  await mongoose.connect(uri);
};

export const disconnectFromDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
