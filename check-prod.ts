import mongoose from 'mongoose';
import { ProductModel } from './apps/api/src/models/product.model.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  const p = await ProductModel.findOne({ slug: 'pantalon-wide-leg-premium' }).lean();
  console.log("BEFORE UPDATE:", JSON.stringify(p, null, 2));

  const updateResult = await ProductModel.updateOne(
    { slug: 'pantalon-wide-leg-premium' },
    { 
      $set: { 
        sizes: ["S", "M", "L", "XL"],
        "colorVariants.$[].availableSizes": ["S", "M", "L", "XL"]
      } 
    }
  );
  console.log("UPDATE RESULT:", updateResult);

  const after = await ProductModel.findOne({ slug: 'pantalon-wide-leg-premium' }).lean();
  console.log("AFTER UPDATE:", JSON.stringify(after, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
