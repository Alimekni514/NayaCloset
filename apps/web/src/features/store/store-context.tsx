import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { CartLine } from '@/features/shared/types';

const CART_KEY = 'darsouk.cart';
const FAV_KEY = 'darsouk.favorites';
const mongoIdPattern = /^[a-fA-F0-9]{24}$/;

/**
 * Composite identity key for a cart line.
 * Changing color or size creates a separate line.
 */
export const cartLineKey = (line: Pick<CartLine, 'productId' | 'selectedColor' | 'selectedSize'>): string =>
  `${line.productId}|${line.selectedColor ?? ''}|${line.selectedSize ?? ''}`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function sanitizeCart(lines: CartLine[]): CartLine[] {
  return lines.filter(
    (line) =>
      mongoIdPattern.test(line.productId) &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0,
  );
}

export type AddToCartPayload = {
  productId: string;
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
  imageUrl?: string;
  name?: string;
  unitPrice?: number;
};

interface StoreContextValue {
  cart: CartLine[];
  cartCount: number;
  addToCart: (payload: AddToCartPayload) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
  removeFromCart: (lineKey: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setCart(sanitizeCart(read<CartLine[]>(CART_KEY, [])));
    setFavorites(read<string[]>(FAV_KEY, []));
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, []);

  const addToCart = useCallback(
    (payload: AddToCartPayload) => {
      const { productId, quantity = 1, selectedColor, selectedSize, imageUrl, name, unitPrice } = payload;
      setCart((prev) => {
        const key = cartLineKey({
          productId,
          ...(selectedColor ? { selectedColor } : {}),
          ...(selectedSize ? { selectedSize } : {}),
        });
        const existing = prev.find((line) => cartLineKey(line) === key);
        const next = existing
          ? prev.map((line) =>
              cartLineKey(line) === key
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            )
          : [
              ...prev,
              {
                productId,
                quantity,
                ...(selectedColor ? { selectedColor } : {}),
                ...(selectedSize ? { selectedSize } : {}),
                ...(imageUrl ? { imageUrl } : {}),
                ...(name ? { name } : {}),
                ...(unitPrice != null ? { unitPrice } : {}),
              },
            ];

        const sanitized = sanitizeCart(next);
        persist(CART_KEY, sanitized);
        return sanitized;
      });
    },
    [persist],
  );

  const setQuantity = useCallback(
    (lineKey: string, quantity: number) => {
      setCart((prev) => {
        const next =
          quantity <= 0
            ? prev.filter((line) => cartLineKey(line) !== lineKey)
            : prev.map((line) => (cartLineKey(line) === lineKey ? { ...line, quantity } : line));

        const sanitized = sanitizeCart(next);
        persist(CART_KEY, sanitized);
        return sanitized;
      });
    },
    [persist],
  );

  const removeFromCart = useCallback(
    (lineKey: string) => {
      setCart((prev) => {
        const next = prev.filter((line) => cartLineKey(line) !== lineKey);
        persist(CART_KEY, next);
        return next;
      });
    },
    [persist],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    persist(CART_KEY, []);
  }, [persist]);

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        const next = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];

        persist(FAV_KEY, next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      cartOpen,
      setCartOpen,
      favorites,
      toggleFavorite,
      isFavorite: (id: string) => favorites.includes(id),
    }),
    [cart, cartOpen, favorites, addToCart, setQuantity, removeFromCart, clearCart, toggleFavorite],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);

  if (!ctx) {
    throw new Error('useStore doit etre utilise dans StoreProvider');
  }

  return ctx;
}
