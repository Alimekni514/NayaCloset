/**
 * Seed script — inserts the Pantalon Wide Leg Premium product into MongoDB.
 *
 * Run from the repo root:
 *   npx ts-node --project apps/api/tsconfig.json -e "require('./apps/api/src/db/seeds/seed-trousers.ts')"
 *
 * Or with tsx:
 *   npx tsx apps/api/src/db/seeds/seed-trousers.ts
 */
import mongoose from 'mongoose';
import { ProductModel } from '../../models/product.model';


const MONGODB_URI = process.env['MONGODB_URI'];

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set. Check your .env file.');
  process.exit(1);
}

const PRODUCT = {
  name: 'Pantalon Wide Leg Premium',
  slug: 'pantalon-wide-leg-premium',
  description:
    'بنطلون Wide Leg خفيف ومريح، مناسب للاستعمال اليومي وحتى للخروجات. خامته ناعمة، وقصّته واسعة تعطيك لوك شيك وعصري. ينجم يتلبس مع تيشورت بسيطة، توب أو شميز، ويتماشى مع السبات، الصندال وحتى الكعب. إذا تحبّي الراحة والأناقة في نفس الوقت، فهذا البنطلون هو الاختيار المثالي. 💕',
  priceCents: 4000,        // 40 TND
  deliveryFeeCents: 800,   // 8 TND
  inventory: 100,
  reservedInventory: 0,
  isActive: true,
  category: 'Pantalons',
  colorVariants: [
    { color: 'Beige',           imageUrl: 'trousers-beige' },
    { color: 'White',           imageUrl: 'trousers-white' },
    { color: 'Black',           imageUrl: 'trousers-black' },
    { color: 'Chocolate Brown', imageUrl: 'trousers-maron' },
    { color: 'Sky Blue',        imageUrl: 'trousers-bleuciel' },
    { color: 'Soft Yellow',     imageUrl: 'trousers-yellow' },
    { color: 'Dusty Pink',      imageUrl: 'trousers-rose' },
  ],
};

async function seed() {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected.');

  const existing = await ProductModel.findOne({ slug: PRODUCT.slug }).lean();

  if (existing) {
    console.log(`⚠️  Product "${PRODUCT.slug}" already exists — updating…`);
    await ProductModel.updateOne({ slug: PRODUCT.slug }, { $set: PRODUCT });
    console.log('✅ Product updated.');
  } else {
    await ProductModel.create(PRODUCT);
    console.log(`✅ Product "${PRODUCT.name}" created successfully.`);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
