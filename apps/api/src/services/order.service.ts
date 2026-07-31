import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { VALIDATABLE_ORDER_STATUSES } from '../constants/order';
import { HttpError } from '../lib/http-error';
import { OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import { writeAuditLog } from './audit.service';

export const createOrder = async ({
  userId,
  items,
  notes,
}: {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
}) => {
  const productIds = items.map((item) => new Types.ObjectId(item.productId));
  const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true }).lean();

  if (products.length !== items.length) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'One or more products are unavailable');
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const normalizedItems = items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'One or more products are unavailable');
    }

    return {
      productId: product._id,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
    };
  });

  const totalCents = normalizedItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );

  const order = await OrderModel.create({
    userId,
    items: normalizedItems,
    totalCents,
    notes,
  });

  return order;
};

export const validateOrder = async ({
  orderId,
  actorUserId,
  actorEmail,
  actorRole,
}: {
  orderId: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN';
}) => {
  const order = await OrderModel.findOneAndUpdate(
    { _id: orderId, status: { $in: Array.from(VALIDATABLE_ORDER_STATUSES) } },
    { status: 'VALIDATED' },
    { new: true },
  );

  if (!order) {
    throw new HttpError(StatusCodes.CONFLICT, 'Order cannot be validated from its current state');
  }

  await writeAuditLog({
    action: 'order.validate',
    entityType: 'Order',
    entityId: order._id.toString(),
    actor: {
      userId: new Types.ObjectId(actorUserId),
      email: actorEmail,
      role: actorRole,
    },
    metadata: { previousAllowedStates: Array.from(VALIDATABLE_ORDER_STATUSES) },
  });

  return order;
};
