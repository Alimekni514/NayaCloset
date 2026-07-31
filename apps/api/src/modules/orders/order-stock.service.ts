import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../lib/http-error';
import { ProductModel } from '../../models/product.model';

import { ORDER_MAX_TOTAL_QUANTITY } from './order.constants';

export const normalizeOrderLines = (
  items: Array<{ productId: string; quantity: number }>,
): Array<{ productId: string; quantity: number }> => {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  const normalized = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  const totalQuantity = normalized.reduce((sum, item) => sum + item.quantity, 0);

  if (totalQuantity > ORDER_MAX_TOTAL_QUANTITY) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Quantite totale invalide.');
  }

  return normalized;
};

export const reserveStock = async (items: Array<{ productId: string; quantity: number }>): Promise<void> => {
  const reservedIds: string[] = [];

  try {
    for (const item of items) {
      const product = await ProductModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(item.productId),
          isActive: true,
          $expr: {
            $gte: [{ $subtract: ['$inventory', '$reservedInventory'] }, item.quantity],
          },
        },
        { $inc: { reservedInventory: item.quantity } },
        { new: true },
      ).lean();

      if (!product) {
        throw new HttpError(StatusCodes.CONFLICT, 'La quantite demandee n\'est plus disponible.');
      }

      reservedIds.push(item.productId);
    }
  } catch (error) {
    if (reservedIds.length > 0) {
      await Promise.all(
        reservedIds.map((productId) => {
          const quantity = items.find((item) => item.productId === productId)?.quantity ?? 0;
          return ProductModel.updateOne({ _id: productId }, { $inc: { reservedInventory: -quantity } });
        }),
      );
    }

    throw error;
  }
};

export const releaseReservedStock = async (
  items: Array<{ productId: Types.ObjectId | string; quantity: number }>,
): Promise<void> => {
  await Promise.all(
    items.map((item) =>
      ProductModel.updateOne({ _id: item.productId }, { $inc: { reservedInventory: -item.quantity } }),
    ),
  );
};

export const consumeReservedStock = async (
  items: Array<{ productId: Types.ObjectId | string; quantity: number }>,
): Promise<void> => {
  await Promise.all(
    items.map((item) =>
      ProductModel.updateOne(
        { _id: item.productId, reservedInventory: { $gte: item.quantity }, inventory: { $gte: item.quantity } },
        { $inc: { reservedInventory: -item.quantity, inventory: -item.quantity } },
      ),
    ),
  );
};
