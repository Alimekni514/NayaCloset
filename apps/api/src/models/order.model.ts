import type { InferSchemaType } from 'mongoose';
import { Schema, Types, model } from 'mongoose';

import { orderStatusValues } from '@delivery-commerce/shared';

const orderSchema = new Schema(
  {
    reference: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
      match: /^[A-Z]{6}$/u,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    customer: {
      userId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
    },
    guest: {
      contactLastName: { type: String, required: true, trim: true },
      contactFirstName: { type: String, trim: true },
      mobile: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
    },
    deliveryAddress: {
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, trim: true },
      governorate: {
        abmId: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
      },
      city: {
        abmId: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
      },
      locality: {
        abmId: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
      },
      postalCode: { type: String, required: true, trim: true },
    },
    status: { type: String, enum: orderStatusValues, default: 'PENDING', index: true },
    items: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true, trim: true },
        productImage: { type: String, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPriceMillimes: { type: Number, required: true, min: 0 },
        lineTotalMillimes: { type: Number, required: true, min: 0 },
      },
    ],
    contentSummary: { type: String, required: true, trim: true, maxlength: 255 },
    subtotalMillimes: { type: Number, required: true, min: 0 },
    deliveryFeeMillimes: { type: Number, required: true, min: 0 },
    totalMillimes: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, enum: ['TND'], default: 'TND' },
    abm: {
      positionId: { type: String, trim: true },
      barcode: { type: String, trim: true },
      statusText: { type: String, trim: true },
      createdAt: { type: Date },
      lastErrorCode: { type: String, trim: true },
      lastErrorMessage: { type: String, trim: true },
      attemptCount: { type: Number, required: true, min: 0, default: 0 },
    },
    submittedAt: { type: Date, required: true, default: Date.now, index: true },
    approvedAt: { type: Date },
    approvedBy: { type: Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false },
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const OrderModel = model('Order', orderSchema);
