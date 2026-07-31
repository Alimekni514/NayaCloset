/**
 * Idempotent seed: adds sizes = ["S","M","L","XL"] and
 * availableSizes to all colorVariants of the trousers product.
 *
 * Run from repo root:
 *   npx tsx --env-file=.env apps/api/src/db/seeds/update-trousers-sizes.ts
 */
import mongoose from 'mongoose';
import { ProductModel } from '../../models/product.model';

const MONGODB_URI = process.env['MONGODB_URI'];

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set. Check your .env file.');
  process.exit(1);
}

const SIZES = ['S', 'M', 'L', 'XL'];

async function seed() {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected.');

  const product = await ProductModel.findOne({ slug: 'pantalon-wide-leg-premium' });

  if (!product) {
    console.error('❌ Product "pantalon-wide-leg-premium" not found. Run seed-trousers.ts first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Update sizes at product level
  product.sizes = SIZES as any;

  // Update availableSizes on every colorVariant
  if (Array.isArray(product.colorVariants)) {
    for (const variant of product.colorVariants as any[]) {
      variant.availableSizes = SIZES;
    }
  }

  await product.save();
  console.log(`✅ Updated sizes for "${product.name}": ${SIZES.join(', ')}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
