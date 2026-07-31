import type { InferSchemaType } from 'mongoose';
import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    inventory: { type: Number, required: true, min: 0, default: 0 },
    reservedInventory: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = model('Product', productSchema);
