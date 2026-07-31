import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { createAbmPosition } from '../abm/positions/abm-position.service';
import { HttpError } from '../../lib/http-error';
import { OrderModel } from '../../models/order.model';
import { writeAuditLog } from '../../services/audit.service';

import { ORDER_APPROVABLE_STATUSES } from './order.constants';
import { toOrderListItemDto } from './order-http.mapper';
import { loadNayaPickupConfiguration } from './order-pickup.service';
import { releaseReservedStock, consumeReservedStock } from './order-stock.service';
import { buildAbmPreviewFromPayload, mapOrderToAbmPosition } from './order-to-abm.mapper';

export const listAdminOrders = async (query: any) => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const filter: Record<string, unknown> = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.governorateId) {
    filter['deliveryAddress.governorate.abmId'] = query.governorateId;
  }

  if (query.from || query.to) {
    filter.submittedAt = {
      ...(query.from ? { $gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
      ...(query.to ? { $lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    };
  }

  if (query.search?.trim()) {
    const expression = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { reference: expression },
      { 'guest.contactLastName': expression },
      { 'guest.contactFirstName': expression },
      { 'guest.mobile': expression },
    ];
  }

  const sortFieldMap: Record<string, string> = {
    createdAt: 'createdAt',
    total: 'totalMillimes',
    reference: 'reference',
    status: 'status',
  };
  const sortField = sortFieldMap[query.sortBy] ?? 'createdAt';
  const sortDirection = query.sortDirection === 'asc' ? 1 : -1;

  const [items, totalItems, summaryAggregation] = await Promise.all([
    OrderModel.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    OrderModel.countDocuments(filter),
    OrderModel.aggregate([
      { $match: {} },
      {
        $group: {
          _id: null,
          pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          approving: { $sum: { $cond: [{ $eq: ['$status', 'APPROVING'] }, 1, 0] } },
          abmCreated: { $sum: { $cond: [{ $eq: ['$status', 'ABM_CREATED'] }, 1, 0] } },
          abmFailed: { $sum: { $cond: [{ $eq: ['$status', 'ABM_FAILED'] }, 1, 0] } },
          pendingTotalMillimes: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, '$totalMillimes', 0] },
          },
        },
      },
    ]),
  ]);

  const summary = summaryAggregation[0] ?? {
    pending: 0,
    approving: 0,
    abmCreated: 0,
    abmFailed: 0,
    pendingTotalMillimes: 0,
  };

  return {
    items: items.map(toOrderListItemDto),
    summary,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
};

export const getAdminOrderDetail = async (orderId: string) => {
  const order = await OrderModel.findById(orderId).lean();

  if (!order) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Commande introuvable.');
  }

  const pickupContext = await loadNayaPickupConfiguration();
  const abmPayload = mapOrderToAbmPosition(order, pickupContext, new Date());

  return {
    order: {
      id: order._id.toString(),
      reference: order.reference,
      status: order.status,
      customer: {
        ...(order.customer?.userId ? { userId: order.customer.userId.toString() } : {}),
        contactLastName: order.guest?.contactLastName ?? '',
        ...(order.guest?.contactFirstName ? { contactFirstName: order.guest.contactFirstName } : {}),
        mobile: order.guest?.mobile ?? '',
        ...(order.guest?.phone ? { phone: order.guest.phone } : {}),
      },
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item: any) => ({
        productId: item.productId.toString(),
        productName: item.productName,
        ...(item.productImage ? { productImage: item.productImage } : {}),
        unitPriceMillimes: item.unitPriceMillimes,
        quantity: item.quantity,
        lineTotalMillimes: item.lineTotalMillimes,
        ...(item.selectedColor ? { selectedColor: item.selectedColor } : {}),
        ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
      })),
      contentSummary: order.contentSummary,
      subtotalMillimes: order.subtotalMillimes,
      deliveryFeeMillimes: order.deliveryFeeMillimes,
      totalMillimes: order.totalMillimes,
      currency: order.currency,
      submittedAt: order.submittedAt.toISOString(),
      ...(order.approvedAt ? { approvedAt: order.approvedAt.toISOString() } : {}),
      ...(order.abm
        ? {
            abm: {
              ...(order.abm.positionId ? { positionId: order.abm.positionId } : {}),
              ...(order.abm.barcode ? { barcode: order.abm.barcode } : {}),
              ...(order.abm.statusText ? { statusText: order.abm.statusText } : {}),
              ...(order.abm.createdAt ? { createdAt: order.abm.createdAt.toISOString() } : {}),
              ...(order.abm.lastErrorCode ? { lastErrorCode: order.abm.lastErrorCode } : {}),
              ...(order.abm.lastErrorMessage ? { lastErrorMessage: order.abm.lastErrorMessage } : {}),
              attemptCount: order.abm.attemptCount ?? 0,
            },
          }
        : {}),
      abmPreview: buildAbmPreviewFromPayload(abmPayload),
    },
  };
};

export const approveAdminOrder = async ({
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
    { _id: orderId, status: { $in: [...ORDER_APPROVABLE_STATUSES] } },
    { status: 'APPROVING' },
    { new: true },
  );

  if (!order) {
    throw new HttpError(StatusCodes.CONFLICT, 'Cette commande a deja ete traitee.', {
      code: 'ORDER_NOT_PENDING',
    });
  }

  await writeAuditLog({
    action: order.status === 'ABM_FAILED' ? 'ORDER_APPROVAL_RETRIED' : 'ORDER_APPROVAL_STARTED',
    entityType: 'Order',
    entityId: order._id.toString(),
    actor: { userId: new Types.ObjectId(actorUserId), email: actorEmail, role: actorRole },
    metadata: { reference: order.reference },
  });

  try {
    const pickupContext = await loadNayaPickupConfiguration();
    const payload = mapOrderToAbmPosition(order.toObject(), pickupContext, new Date());
    const result = await createAbmPosition(payload);

    await OrderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'ABM_CREATED',
          approvedAt: new Date(),
          approvedBy: new Types.ObjectId(actorUserId),
          'abm.positionId': result.position.id,
          'abm.createdAt': new Date(),
          'abm.lastErrorCode': null,
          'abm.lastErrorMessage': null,
          'abm.statusText': result.message,
        },
        $inc: { 'abm.attemptCount': 1 },
      },
    );
    await consumeReservedStock(
      order.items.map((item) => ({
        productId: item.productId as unknown as Types.ObjectId,
        quantity: item.quantity,
      })),
    );
    await writeAuditLog({
      action: 'ORDER_ABM_POSITION_CREATED',
      entityType: 'Order',
      entityId: order._id.toString(),
      actor: { userId: new Types.ObjectId(actorUserId), email: actorEmail, role: actorRole },
      metadata: { reference: order.reference, positionId: result.position.id },
    });

    return {
      order: {
        id: order._id.toString(),
        reference: order.reference,
        status: 'ABM_CREATED',
        abmPositionId: result.position.id,
      },
      message: 'La position ABM a ete creee avec succes.',
    };
  } catch (error) {
    const safeMessage =
      error instanceof HttpError ? error.message : 'La commande est enregistree, mais ABM a refuse la creation de la position.';
    const safeCode =
      error instanceof HttpError && typeof (error.details as { code?: string } | undefined)?.code === 'string'
        ? (error.details as { code: string }).code
        : 'ABM_POSITION_CREATION_FAILED';

    await OrderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'ABM_FAILED',
          'abm.lastErrorCode': safeCode,
          'abm.lastErrorMessage': safeMessage,
        },
        $inc: { 'abm.attemptCount': 1 },
      },
    );
    await writeAuditLog({
      action: 'ORDER_ABM_POSITION_FAILED',
      entityType: 'Order',
      entityId: order._id.toString(),
      actor: { userId: new Types.ObjectId(actorUserId), email: actorEmail, role: actorRole },
      metadata: { reference: order.reference, errorCode: safeCode },
    });

    throw new HttpError(StatusCodes.BAD_GATEWAY, 'La commande est enregistree, mais ABM a refuse la creation de la position.', {
      code: safeCode,
    });
  }
};

export const declineAdminOrder = async ({
  orderId,
  reason,
  actorUserId,
  actorEmail,
  actorRole,
}: {
  orderId: string;
  reason?: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN';
}) => {
  const order = await OrderModel.findOne({ _id: orderId, status: 'PENDING' });

  if (!order) {
    throw new HttpError(StatusCodes.CONFLICT, 'Impossible de refuser cette commande.', {
      code: 'ORDER_DECLINE_FAILED',
    });
  }

  await releaseReservedStock(
    order.items.map((item) => ({
      productId: item.productId as unknown as Types.ObjectId,
      quantity: item.quantity,
    })),
  );
  await writeAuditLog({
    action: 'ORDER_DECLINED',
    entityType: 'Order',
    entityId: order._id.toString(),
    actor: { userId: new Types.ObjectId(actorUserId), email: actorEmail, role: actorRole },
    metadata: {
      reference: order.reference,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    },
  });
  await OrderModel.deleteOne({ _id: order._id, status: 'PENDING' });
  await writeAuditLog({
    action: 'ORDER_DELETED_AFTER_DECLINE',
    entityType: 'Order',
    entityId: order._id.toString(),
    actor: { userId: new Types.ObjectId(actorUserId), email: actorEmail, role: actorRole },
    metadata: { reference: order.reference },
  });

  return {
    order: {
      id: order._id.toString(),
      reference: order.reference,
      status: 'REJECTED',
    },
    message: 'La commande a ete refusee et supprimee.',
  };
};
