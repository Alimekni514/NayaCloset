import {
  ORDER_CONTENT_SUMMARY_MAX_LENGTH,
  ORDER_CURRENCY,
  ORDER_DELIVERY_FEE_MILLIMES,
} from './order.constants';

export const centsToMillimes = (priceCents: number): number => priceCents * 10;

export const buildOrderContentSummary = (productNames: string[]): string => {
  const uniqueNames = productNames
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name, index, values) => values.indexOf(name) === index);
  const joined = uniqueNames.join(', ');

  if (joined.length <= ORDER_CONTENT_SUMMARY_MAX_LENGTH) {
    return joined;
  }

  return `${joined.slice(0, ORDER_CONTENT_SUMMARY_MAX_LENGTH - 3).trimEnd()}...`;
};

export const createPricedOrderItem = ({
  product,
  quantity,
}: {
  product: {
    _id: unknown;
    name: string;
    priceCents: number;
    images?: string[];
  };
  quantity: number;
}) => {
  const unitPriceMillimes = centsToMillimes(product.priceCents);
  const lineTotalMillimes = unitPriceMillimes * quantity;

  return {
    productId: product._id,
    productName: product.name,
    ...(Array.isArray(product.images) && product.images[0] ? { productImage: product.images[0] } : {}),
    unitPriceMillimes,
    quantity,
    lineTotalMillimes,
  };
};

export const calculateOrderTotals = (
  items: Array<{ lineTotalMillimes: number }>,
): {
  subtotalMillimes: number;
  deliveryFeeMillimes: number;
  totalMillimes: number;
  currency: typeof ORDER_CURRENCY;
} => {
  const subtotalMillimes = items.reduce((sum, item) => sum + item.lineTotalMillimes, 0);
  const deliveryFeeMillimes = ORDER_DELIVERY_FEE_MILLIMES;

  return {
    subtotalMillimes,
    deliveryFeeMillimes,
    totalMillimes: subtotalMillimes + deliveryFeeMillimes,
    currency: ORDER_CURRENCY,
  };
};
