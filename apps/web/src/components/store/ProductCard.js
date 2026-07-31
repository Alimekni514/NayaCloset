import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTND } from "@/lib/format";
import { useStore } from "@/features/store/store-context";
import { toast } from "sonner";
export function ProductCard({ product }) {
    const { addToCart, toggleFavorite, isFavorite } = useStore();
    const favorite = isFavorite(product.id);
    const outOfStock = product.stock === 0;
    return (_jsxs("article", { className: "surface-card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lift", children: [_jsxs("div", { className: "relative aspect-square overflow-hidden bg-secondary", children: [_jsx(Link, { to: "/produits/$productId", params: { productId: product.slug }, "aria-label": product.name, children: _jsx("img", { src: product.images[0], alt: product.name, loading: "lazy", width: 900, height: 900, className: "size-full object-cover transition-transform duration-500 group-hover:scale-105" }) }), _jsxs("div", { className: "absolute left-3 top-3 flex flex-col gap-1.5", children: [product.compareAtPrice ? (_jsx("span", { className: "rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground", children: "Promo" })) : null, outOfStock ? (_jsx("span", { className: "rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-semibold text-background", children: "Rupture" })) : null] }), _jsx("button", { type: "button", onClick: () => toggleFavorite(product.id), "aria-pressed": favorite, "aria-label": favorite ? "Retirer des favoris" : "Ajouter aux favoris", className: "absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-soft transition-colors hover:bg-card", children: _jsx(Heart, { className: cn("size-4", favorite && "fill-destructive text-destructive") }) })] }), _jsxs("div", { className: "flex flex-1 flex-col gap-3 p-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "truncate text-base font-semibold", children: _jsx(Link, { to: "/produits/$productId", params: { productId: product.slug }, children: product.name }) }), _jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: product.description })] }), _jsxs("div", { className: "mt-auto flex items-end justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-display text-lg font-semibold", children: formatTND(product.price) }), product.compareAtPrice ? (_jsx("p", { className: "text-xs text-muted-foreground line-through", children: formatTND(product.compareAtPrice) })) : null] }), _jsxs(Button, { size: "sm", disabled: outOfStock, onClick: () => {
                                    addToCart({ productId: product.id, quantity: 1, name: product.name, ...(product.images[0] ? { imageUrl: product.images[0] } : {}), unitPrice: product.price });
                                    toast.success("Ajouté au panier", { description: product.name });
                                }, children: [_jsx(ShoppingBag, { className: "size-4" }), "Ajouter"] })] })] })] }));
}
