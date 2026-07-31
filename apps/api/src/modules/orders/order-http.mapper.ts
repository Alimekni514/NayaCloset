export const toOrderListItemDto = (order: any) => ({
  id: order._id.toString(),
  reference: order.reference,
  status: order.status,
  customerName: [order.guest.contactFirstName, order.guest.contactLastName].filter(Boolean).join(' '),
  mobile: order.guest.mobile,
  destination: [
    order.deliveryAddress.locality.label,
    order.deliveryAddress.city.label,
    order.deliveryAddress.governorate.label,
  ]
    .filter(Boolean)
    .join(', '),
  itemsCount: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
  subtotalMillimes: order.subtotalMillimes,
  deliveryFeeMillimes: order.deliveryFeeMillimes,
  totalMillimes: order.totalMillimes,
  currency: order.currency,
  createdAt: order.createdAt.toISOString(),
  ...(order.abm?.positionId ? { abmPositionId: order.abm.positionId } : {}),
  ...(order.abm?.lastErrorMessage ? { abmErrorMessage: order.abm.lastErrorMessage } : {}),
});

export const toGuestOrderResponseDto = (order: any) => ({
  order: {
    id: order._id.toString(),
    reference: order.reference,
    status: order.status,
    subtotalMillimes: order.subtotalMillimes,
    deliveryFeeMillimes: order.deliveryFeeMillimes,
    totalMillimes: order.totalMillimes,
    currency: order.currency,
  },
  message: 'Votre commande a ete enregistree et sera verifiee.',
});
