import type { InferSchemaType } from 'mongoose';
import { Schema, model } from 'mongoose';

const colorVariantSchema = new Schema(
  {
    color: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    inventory: { type: Number, required: true, min: 0, default: 0 },
    reservedInventory: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    // Extended fields — optional for backward-compatibility with existing products
    category: { type: String, trim: true },
    deliveryFeeCents: { type: Number, min: 0 },
    colorVariants: { type: [colorVariantSchema], default: undefined },
  },
  { timestamps: true, versionKey: false },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = model('Product', productSchema);
