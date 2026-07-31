import type { CreateAbmPositionRequest } from '@delivery-commerce/shared';

import { ORDER_DELIVERY_TIME_FROM, ORDER_DELIVERY_TIME_TO, ORDER_FIXED_WEIGHT, ORDER_PICKUP_TIME } from './order.constants';

const toTunisiaDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Tunis',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

/**
 * Maps an English color name (as stored in MongoDB) to the French label
 * used in ABM TAGS for traceability.
 */
const COLOR_TO_FRENCH: Record<string, string> = {
  Beige: 'Beige',
  White: 'Blanc',
  Black: 'Noir',
  'Chocolate Brown': 'Marron',
  'Sky Blue': 'Bleu Ciel',
  'Soft Yellow': 'Jaune',
  'Dusty Pink': 'Rose',
};

const toFrenchColor = (color: string): string => COLOR_TO_FRENCH[color] ?? color;

/**
 * Build the ABM TAGS string from order items.
 *
 * Format:
 *   ProductName [Color/Size xQty, ...]   (when color/size present)
 *   ProductName xQty                     (fallback)
 *
 * Multiple products are separated by " | ".
 *
 * Example:
 *   Pantalon Wide Leg Premium [Jaune/M x2, Noir/L x1]
 */
export const buildAbmTags = (
  items: Array<{ productName: string; quantity: number; selectedColor?: string; selectedSize?: string }>,
): string => {
  // Group by productName
  const byProduct = new Map<
    string,
    Array<{ quantity: number; selectedColor?: string; selectedSize?: string }>
  >();

  for (const item of items) {
    const group = byProduct.get(item.productName) ?? [];
    group.push({
      quantity: item.quantity,
      ...(item.selectedColor ? { selectedColor: item.selectedColor } : {}),
      ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
    });
    byProduct.set(item.productName, group);
  }

  return [...byProduct.entries()]
    .map(([productName, variants]) => {
      const hasVariantInfo = variants.some((v) => v.selectedColor || v.selectedSize);

      if (!hasVariantInfo) {
        const totalQty = variants.reduce((sum, v) => sum + v.quantity, 0);
        return `${productName} x${totalQty}`;
      }

      const variantParts = variants.map((v) => {
        const colorLabel = v.selectedColor ? toFrenchColor(v.selectedColor) : '';
        const sizeLabel = v.selectedSize ?? '';
        const variantKey = [colorLabel, sizeLabel].filter(Boolean).join('/');
        return `${variantKey} x${v.quantity}`;
      });

      return `${productName} [${variantParts.join(', ')}]`;
    })
    .join(' | ');
};

export const mapOrderToAbmPosition = (
  order: any,
  pickupContext: {
    pickupAddress: any;
    serviceId: string;
    paymentModeId: string;
  },
  now: Date,
): CreateAbmPositionRequest => {
  // Build the rich TAGS string from order items (includes color + size)
  const tagsString = buildAbmTags(
    (order.items as Array<{ productName: string; quantity: number; selectedColor?: string; selectedSize?: string }>),
  );

  return {
    pickup: {
      addressBookId: pickupContext.pickupAddress.id,
      contactLastName: pickupContext.pickupAddress.contactLastName,
      ...(pickupContext.pickupAddress.contactFirstName
        ? { contactFirstName: pickupContext.pickupAddress.contactFirstName }
        : {}),
      addressLine1: pickupContext.pickupAddress.addressLine1,
      ...(pickupContext.pickupAddress.addressLine2 ? { addressLine2: pickupContext.pickupAddress.addressLine2 } : {}),
      governorateId: pickupContext.pickupAddress.governorateId,
      ...(pickupContext.pickupAddress.governorateName ? { governorateName: pickupContext.pickupAddress.governorateName } : {}),
      cityId: pickupContext.pickupAddress.cityId,
      ...(pickupContext.pickupAddress.cityName ? { cityName: pickupContext.pickupAddress.cityName } : {}),
      localityId: pickupContext.pickupAddress.localityId,
      ...(pickupContext.pickupAddress.localityName ? { localityName: pickupContext.pickupAddress.localityName } : {}),
      postalCode: pickupContext.pickupAddress.postalCode,
      mobile: pickupContext.pickupAddress.mobile,
      ...(pickupContext.pickupAddress.phone ? { phone: pickupContext.pickupAddress.phone } : {}),
      ...(pickupContext.pickupAddress.fax ? { fax: pickupContext.pickupAddress.fax } : {}),
      ...(pickupContext.pickupAddress.email ? { email: pickupContext.pickupAddress.email } : {}),
    },
    delivery: {
      contactLastName: order.guest.contactLastName,
      ...(order.guest.contactFirstName ? { contactFirstName: order.guest.contactFirstName } : {}),
      addressLine1: order.deliveryAddress.addressLine1,
      ...(order.deliveryAddress.addressLine2 ? { addressLine2: order.deliveryAddress.addressLine2 } : {}),
      governorateId: order.deliveryAddress.governorate.abmId,
      governorateName: order.deliveryAddress.governorate.label,
      cityId: order.deliveryAddress.city.abmId,
      cityName: order.deliveryAddress.city.label,
      localityId: order.deliveryAddress.locality.abmId,
      localityName: order.deliveryAddress.locality.label,
      postalCode: order.deliveryAddress.postalCode,
      mobile: order.guest.mobile,
      ...(order.guest.phone ? { phone: order.guest.phone } : {}),
    },
    parcel: {
      pickupDate: toTunisiaDate(now),
      pickupTime: ORDER_PICKUP_TIME,
      weight: ORDER_FIXED_WEIGHT,
      pieces: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      reference: order.reference,
      declaredValue: order.subtotalMillimes / 1000,
      // Store the pre-built TAGS string as a single element.
      // abm-position.mapper serializeTags will join it as-is.
      contents: [tagsString],
    },
    service: {
      serviceId: pickupContext.serviceId,
      codAmount: order.totalMillimes / 1000,
      paymentModeId: pickupContext.paymentModeId,
      exchange: false,
      exchangeContents: '',
      allowOpen: false,
    },
  };
};

export const buildAbmPreviewFromPayload = (payload: CreateAbmPositionRequest) => ({
  pickup: {
    CONTACTNOM: payload.pickup.contactLastName,
    CONTACTPRENOM: payload.pickup.contactFirstName ?? '',
    ADR1: payload.pickup.addressLine1,
    ADR2: payload.pickup.addressLine2 ?? '',
    ELOCN1: payload.pickup.governorateId,
    ELOCN2: payload.pickup.cityId,
    ELOCN3: payload.pickup.localityId,
    CODEPOSTAL: payload.pickup.postalCode,
    ADRPORTABLE: payload.pickup.mobile,
    ADRTEL: payload.pickup.phone ?? '',
    ADRFAX: payload.pickup.fax ?? '',
    ADRMAIL: payload.pickup.email ?? '',
  },
  delivery: {
    LOCN1LIV: payload.delivery.governorateId,
    LOCN2LIV: payload.delivery.cityId,
    LOCN3LIV: payload.delivery.localityId,
    ADRCODEPOSTALLIV: payload.delivery.postalCode,
    ADR1LIV: payload.delivery.addressLine1,
    ADR2LIV: payload.delivery.addressLine2 ?? '',
    CONTACTNOMLIV: payload.delivery.contactLastName,
    CONTACTPRENOMLIV: payload.delivery.contactFirstName ?? '',
    ADRPORTABLELIV: payload.delivery.mobile,
    ADRTELLIV: payload.delivery.phone ?? '',
    POSITION_TIME_LIV_DISPO_FROM: ORDER_DELIVERY_TIME_FROM,
    POSITION_TIME_LIV_DISPO_TO: ORDER_DELIVERY_TIME_TO,
  },
  parcel: {
    DATEENL: payload.parcel.pickupDate,
    HEURENL: payload.parcel.pickupTime,
    POIDS: String(payload.parcel.weight),
    POSNBPIECE: String(payload.parcel.pieces),
    POSREFERENCE: payload.parcel.reference ?? '',
    VALEUR: String(payload.parcel.declaredValue ?? 0),
    // contents[0] is the pre-built TAGS string
    TAGS: payload.parcel.contents[0] ?? '',
  },
  service: {
    SERVICEID: payload.service.serviceId,
    MONTANT: String(payload.service.codAmount),
    POS_MR_CHOIX: payload.service.paymentModeId,
    RTRN: payload.service.exchange ? '1' : '0',
    RTRNCONTENU: payload.service.exchangeContents ?? '',
    POS_ALLOW_OPEN: payload.service.allowOpen ? '1' : '0',
  },
});
