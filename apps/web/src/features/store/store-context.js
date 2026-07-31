import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
const CART_KEY = 'darsouk.cart';
const FAV_KEY = 'darsouk.favorites';
const mongoIdPattern = /^[a-fA-F0-9]{24}$/;
/**
 * Composite identity key for a cart line.
 * Changing color or size creates a separate line.
 */
export const cartLineKey = (line) => `${line.productId}|${line.selectedColor ?? ''}|${line.selectedSize ?? ''}`;
function read(key, fallback) {
    if (typeof window === 'undefined') {
        return fallback;
    }
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }
    catch {
        return fallback;
    }
}
function sanitizeCart(lines) {
    return lines.filter((line) => mongoIdPattern.test(line.productId) &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0);
}
const StoreContext = createContext(null);
export function StoreProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    useEffect(() => {
        setCart(sanitizeCart(read(CART_KEY, [])));
        setFavorites(read(FAV_KEY, []));
    }, []);
    const persist = useCallback((key, value) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    }, []);
    const addToCart = useCallback((payload) => {
        const { productId, quantity = 1, selectedColor, selectedSize, imageUrl, name, unitPrice } = payload;
        setCart((prev) => {
            const key = cartLineKey({
                productId,
                ...(selectedColor ? { selectedColor } : {}),
                ...(selectedSize ? { selectedSize } : {}),
            });
            const existing = prev.find((line) => cartLineKey(line) === key);
            const next = existing
                ? prev.map((line) => cartLineKey(line) === key
                    ? { ...line, quantity: line.quantity + quantity }
                    : line)
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
    }, [persist]);
    const setQuantity = useCallback((lineKey, quantity) => {
        setCart((prev) => {
            const next = quantity <= 0
                ? prev.filter((line) => cartLineKey(line) !== lineKey)
                : prev.map((line) => (cartLineKey(line) === lineKey ? { ...line, quantity } : line));
            const sanitized = sanitizeCart(next);
            persist(CART_KEY, sanitized);
            return sanitized;
        });
    }, [persist]);
    const removeFromCart = useCallback((lineKey) => {
        setCart((prev) => {
            const next = prev.filter((line) => cartLineKey(line) !== lineKey);
            persist(CART_KEY, next);
            return next;
        });
    }, [persist]);
    const clearCart = useCallback(() => {
        setCart([]);
        persist(CART_KEY, []);
    }, [persist]);
    const toggleFavorite = useCallback((productId) => {
        setFavorites((prev) => {
            const next = prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId];
            persist(FAV_KEY, next);
            return next;
        });
    }, [persist]);
    const value = useMemo(() => ({
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
        isFavorite: (id) => favorites.includes(id),
    }), [cart, cartOpen, favorites, addToCart, setQuantity, removeFromCart, clearCart, toggleFavorite]);
    return _jsx(StoreContext.Provider, { value: value, children: children });
}
export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) {
        throw new Error('useStore doit etre utilise dans StoreProvider');
    }
    return ctx;
}
