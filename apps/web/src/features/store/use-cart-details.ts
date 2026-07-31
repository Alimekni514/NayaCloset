import { useMemo } from "react";
import { useProductsByIds } from "@/features/shared/queries";
import { useStore } from "./store-context";

export const SHIPPING_FEE = 8;

export function useCartDetails() {
  const { cart } = useStore();
  const ids = useMemo(() => cart.map((line) => line.productId), [cart]);
  const { data: products, isLoading, error } = useProductsByIds(ids);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const product = products?.find((p) => p.id === line.productId);
          return product ? { product, quantity: line.quantity } : null;
        })
        .filter((value): value is { product: NonNullable<typeof products>[number]; quantity: number } => !!value),
    [cart, products],
  );

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shippingFee = subtotal === 0 ? 0 : SHIPPING_FEE;

  return {
    lines,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    isLoading: ids.length > 0 && isLoading,
    error,
  };
}
