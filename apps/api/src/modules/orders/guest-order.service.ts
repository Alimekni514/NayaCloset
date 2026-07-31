import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../lib/http-error';
import { OrderModel } from '../../models/order.model';
import { ProductModel } from '../../models/product.model';
import { writeAuditLog } from '../../services/audit.service';
import { getCities, getGovernorates, getLocalities, getPostalCode } from '../abm/positions/abm-position.service';

import { calculateOrderTotals, createPricedOrderItem, buildOrderContentSummary } from './order-pricing.service';
import { generateUniqueOrderReference } from './order-reference.service';
import { normalizeOrderLines, reserveStock } from './order-stock.service';

export const createGuestOrder = async ({
  userId,
  idempotencyKey,
  items,
  delivery,
}: {
  userId?: string;
  idempotencyKey?: string;
  items: Array<{ productId: string; quantity: number }>;
  delivery: {
    contactLastName: string;
    contactFirstName?: string;
    addressLine1: string;
    addressLine2?: string;
    governorateId: string;
    cityId: string;
    localityId: string;
    postalCode: string;
    mobile: string;
    phone?: string;
  };
}) => {
  const normalizedPostalCode = delivery.postalCode.replace(/[^\d]/gu, '').slice(0, 4);
  const normalizedMobile = delivery.mobile.replace(/[^\d]/gu, '');
  const normalizedPhone = delivery.phone?.replace(/[^\d]/gu, '');

  if (idempotencyKey) {
    const existing = await OrderModel.findOne({ idempotencyKey }).lean();

    if (existing) {
      throw new HttpError(StatusCodes.CONFLICT, 'Cette commande a deja ete enregistree.', {
        code: 'DUPLICATE_SUBMISSION',
      });
    }
  }

  const normalizedItems = normalizeOrderLines(items);

  if (normalizedItems.length === 0) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Votre panier est vide.');
  }

  const [governorates, cities, localities, postalCodeResponse] = await Promise.all([
    getGovernorates(),
    getCities(delivery.governorateId),
    getLocalities(delivery.cityId),
    getPostalCode(delivery.localityId),
  ]);

  const governorate = governorates.find((item) => item.id === delivery.governorateId);
  if (!governorate) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "L'adresse de livraison selectionnee n'est pas valide.", {
      code: 'INVALID_LOCATION',
    });
  }

  const city = cities.find((item) => item.id === delivery.cityId);
  if (!city) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Cette ville ne correspond pas au gouvernorat selectionne.', {
      code: 'INVALID_LOCATION',
    });
  }

  const locality = localities.find((item) => item.id === delivery.localityId);
  if (!locality) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "L'adresse de livraison selectionnee n'est pas valide.", {
      code: 'INVALID_LOCATION',
    });
  }

  if (postalCodeResponse.postalCode.trim() !== normalizedPostalCode) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "L'adresse de livraison selectionnee n'est pas valide.", {
      code: 'INVALID_LOCATION',
    });
  }

  const productIds = normalizedItems.map((item) => new Types.ObjectId(item.productId));
  const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true }).lean();

  if (products.length !== normalizedItems.length) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Un ou plusieurs articles ne sont plus disponibles.', {
      code: 'OUT_OF_STOCK',
    });
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const pricedItems = normalizedItems.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Un ou plusieurs articles ne sont plus disponibles.', {
        code: 'OUT_OF_STOCK',
      });
    }

    return createPricedOrderItem({ product: product as any, quantity: item.quantity });
  });

  await reserveStock(normalizedItems);

  const reference = await generateUniqueOrderReference();
  const totals = calculateOrderTotals(pricedItems);
  const order = await OrderModel.create({
    reference,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    ...(userId ? { customer: { userId: new Types.ObjectId(userId) } } : { customer: {} }),
    guest: {
      contactLastName: delivery.contactLastName.trim(),
      ...(delivery.contactFirstName?.trim() ? { contactFirstName: delivery.contactFirstName.trim() } : {}),
      mobile: normalizedMobile,
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
    },
    deliveryAddress: {
      addressLine1: delivery.addressLine1.trim(),
      ...(delivery.addressLine2?.trim() ? { addressLine2: delivery.addressLine2.trim() } : {}),
      governorate: { abmId: governorate.id, label: governorate.label },
      city: { abmId: city.id, label: city.label },
      locality: { abmId: locality.id, label: locality.label },
      postalCode: postalCodeResponse.postalCode.trim(),
    },
    status: 'PENDING',
    items: pricedItems,
    contentSummary: buildOrderContentSummary(pricedItems.map((item) => item.productName)),
    ...totals,
    abm: { attemptCount: 0 },
    submittedAt: new Date(),
  });

  await writeAuditLog({
    action: 'GUEST_ORDER_CREATED',
    entityType: 'Order',
    entityId: order._id.toString(),
    ...(userId ? { actor: { userId: new Types.ObjectId(userId) } } : {}),
    metadata: {
      reference: order.reference,
      itemsCount: order.items.length,
      totalMillimes: order.totalMillimes,
    },
  });

  return order;
};
