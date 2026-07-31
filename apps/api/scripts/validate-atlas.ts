/**
 * Atlas validation script — run with:
 *   node --import tsx apps/api/scripts/validate-atlas.ts
 *
 * Checks:
 *  1. Mongoose connects to Atlas
 *  2. All model indexes are built
 *  3. Collections exist (or are created)
 *  4. No demo/seed data is present
 *  5. Prints a summary (URI is NOT printed)
 */

// Load env before anything else
import '../src/config/env.js';

import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { AuditLogModel } from '../src/models/audit-log.model.js';
import { OrderModel } from '../src/models/order.model.js';
import { ProductModel } from '../src/models/product.model.js';
import { RefreshSessionModel } from '../src/models/refresh-session.model.js';
import { UserModel } from '../src/models/user.model.js';

const SEPARATOR = '─'.repeat(60);

const log = (msg: string) => console.log(msg);
const ok  = (msg: string) => console.log(`  ✅ ${msg}`);
const warn = (msg: string) => console.log(`  ⚠️  ${msg}`);
const fail = (msg: string) => console.log(`  ❌ ${msg}`);

async function run() {
  log(SEPARATOR);
  log('NayaCloset — MongoDB Atlas Validation');
  log(SEPARATOR);

  // 1. Connect
  log('\n[1] Connecting to MongoDB Atlas…');
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    ok(`Connected — db: ${mongoose.connection.name}, host: ${mongoose.connection.host}`);
  } catch (err) {
    fail(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // 2. Sync indexes
  log('\n[2] Building / verifying indexes…');
  const models = [UserModel, ProductModel, OrderModel, RefreshSessionModel, AuditLogModel];
  for (const model of models) {
    try {
      await model.syncIndexes();
      ok(`${model.modelName} indexes OK`);
    } catch (err) {
      fail(`${model.modelName} index sync failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. List collections
  log('\n[3] Collections in database…');
  const collections = await mongoose.connection.db!.listCollections().toArray();
  if (collections.length === 0) {
    warn('No collections yet (fresh database — they will be created on first write)');
  } else {
    for (const col of collections) {
      const count = await mongoose.connection.db!.collection(col.name).countDocuments();
      ok(`${col.name} — ${count} document(s)`);
    }
  }

  // 4. Check for seed/demo data
  log('\n[4] Checking for development seed data…');
  const seedUsers = await UserModel.find({
    email: { $in: ['admin@example.com', 'yasmine@example.com', 'nora@example.com'] },
  }).lean();
  if (seedUsers.length > 0) {
    warn(`Found ${seedUsers.length} test/seed user(s) — remove before production launch`);
    seedUsers.forEach((u) => warn(`  seed user: ${u.email}`));
  } else {
    ok('No development seed users found');
  }

  // 5. Summary
  log(`\n${SEPARATOR}`);
  log('Validation complete');
  log(SEPARATOR);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Unhandled error during validation:', err instanceof Error ? err.message : err);
  process.exit(1);
});
