// Cleanup smoke test data
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { RefreshSessionModel } from '../src/models/refresh-session.model.js';
import { UserModel } from '../src/models/user.model.js';

await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
const user = await UserModel.findOneAndDelete({ email: 'test-smoke@nayacloset.dev' });
if (user) {
  await RefreshSessionModel.deleteMany({ userId: user._id });
  console.log('✅ Smoke test user and sessions cleaned up');
} else {
  console.log('ℹ️  No smoke test user found (already clean)');
}
await mongoose.disconnect();
