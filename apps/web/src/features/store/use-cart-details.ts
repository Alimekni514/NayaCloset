import { useMemo } from "react";
import { useProductsByIds } from "@/features/shared/queries";
import { useStore } from "./store-context";
import { cartLineKey } from "./store-context";

export const SHIPPING_FEE = 8;

/**
 * Returns enriched cart lines for display.
 *
 * Lines that have cached unitPrice/name/imageUrl (variant lines) use those values directly.
 * Lines without cached data fall back to a product lookup by id.
 */
export function useCartDetails() {
  const { cart } = useStore();

  // Only look up products that don't have cached display data
  const idsToFetch = useMemo(
    () => [...new Set(cart.filter((line) => !line.unitPrice).map((line) => line.productId))],
    [cart],
  );
  const { data: products, isLoading, error } = useProductsByIds(idsToFetch);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          // If the line has cached data, use it
          if (line.unitPrice != null && line.name) {
            return {
              key: cartLineKey(line),
              productId: line.productId,
              name: line.name,
              imageUrl: line.imageUrl ?? '',
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              selectedColor: line.selectedColor,
              selectedSize: line.selectedSize,
              stock: 999, // stock will be validated server-side
            };
          }
          // Fall back to fetched product data
          const product = products?.find((p) => p.id === line.productId);
          if (!product) return null;
          return {
            key: cartLineKey(line),
            productId: line.productId,
            name: product.name,
            imageUrl: product.images[0] ?? '',
            unitPrice: product.price,
            quantity: line.quantity,
            selectedColor: line.selectedColor,
            selectedSize: line.selectedSize,
            stock: product.stock,
          };
        })
        .filter((value): value is NonNullable<typeof value> => !!value),
    [cart, products],
  );

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shippingFee = subtotal === 0 ? 0 : SHIPPING_FEE;

  return {
    lines,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    isLoading: idsToFetch.length > 0 && isLoading,
    error,
  };
}
