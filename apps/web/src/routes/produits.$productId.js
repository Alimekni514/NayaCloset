import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { useProduct } from "@/features/shared/queries";
import { useStore } from "@/features/store/store-context";
import { COLOR_SWATCH_CSS } from "@/features/shared/product-assets";
import { formatTND } from "@/lib/format";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/produits/$productId")({
    head: () => ({
        meta: [
            { title: "Fiche produit — Dar Souk" },
            { name: "description", content: "Détails, prix en TND, stock et livraison du produit sélectionné." },
        ],
    }),
    component: ProductPage,
});
function ProductPage() {
    const { productId } = Route.useParams();
    const { data: product, isLoading, error, refetch } = useProduct(productId);
    const { addToCart, toggleFavorite, isFavorite, setCartOpen } = useStore();
    // Current selector state
    const [activeColor, setActiveColor] = useState(null);
    const [activeSize, setActiveSize] = useState(null);
    const [selectorQty, setSelectorQty] = useState(1);
    const [sizeError, setSizeError] = useState(false);
    // Pending variant lines the user is building before committing to cart
    const [pendingLines, setPendingLines] = useState([]);
    const hasColorVariants = product?.colorVariants && product.colorVariants.length > 0;
    const hasSizes = product?.sizes && product.sizes.length > 0;
    // Resolve displayed image based on active color
    const displayedImage = (() => {
        if (!product)
            return undefined;
        if (hasColorVariants && activeColor) {
            const variant = product.colorVariants.find((v) => v.color === activeColor);
            return variant?.imageUrl ?? product.images[0];
        }
        return product.images[0];
    })();
    const handleColorSelect = (color, imageUrl) => {
        setActiveColor(color);
        // Prefetch image for instant swap
        const img = new Image();
        img.src = imageUrl;
    };
    const handleAddVariant = () => {
        if (!product)
            return;
        if (hasSizes && !activeSize) {
            setSizeError(true);
            return;
        }
        setSizeError(false);
        const colorImageUrl = activeColor
            ? (product.colorVariants?.find((v) => v.color === activeColor)?.imageUrl ?? product.images[0] ?? '')
            : (product.images[0] ?? '');
        const colorLabel = activeColor ?? '';
        const sizeLabel = activeSize ?? '';
        setPendingLines((prev) => {
            const existing = prev.find((l) => l.color === colorLabel && l.size === sizeLabel);
            if (existing) {
                return prev.map((l) => l.color === colorLabel && l.size === sizeLabel
                    ? { ...l, quantity: l.quantity + selectorQty }
                    : l);
            }
            return [...prev, { color: colorLabel, colorImageUrl, size: sizeLabel, quantity: selectorQty }];
        });
        // Reset quantity after adding
        setSelectorQty(1);
    };
    const handleCommitToCart = () => {
        if (!product)
            return;
        if (pendingLines.length === 0) {
            // No pending lines — direct add (products without variants)
            addToCart({
                productId: product.id,
                quantity: selectorQty,
                name: product.name,
                ...(product.images[0] ? { imageUrl: product.images[0] } : {}),
                unitPrice: product.price,
            });
            setCartOpen(true);
            toast.success("Ajouté au panier", { description: product.name });
            return;
        }
        for (const line of pendingLines) {
            addToCart({
                productId: product.id,
                quantity: line.quantity,
                ...(line.color ? { selectedColor: line.color } : {}),
                ...(line.size ? { selectedSize: line.size } : {}),
                ...(line.colorImageUrl ? { imageUrl: line.colorImageUrl } : {}),
                name: product.name,
                unitPrice: product.price,
            });
        }
        setPendingLines([]);
        setCartOpen(true);
        const totalQty = pendingLines.reduce((s, l) => s + l.quantity, 0);
        toast.success(`${totalQty} article(s) ajouté(s) au panier`, { description: product.name });
    };
    return (_jsx(StoreLayout, { children: _jsx("div", { className: "mx-auto max-w-7xl px-4 py-10 sm:px-6", children: isLoading ? (_jsx(LoadingSkeleton, { count: 4 })) : error || !product ? (_jsx(ErrorState, { message: "Ce produit n'existe pas ou n'est plus disponible.", onRetry: () => refetch() })) : (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "text-sm text-muted-foreground", children: [_jsx(Link, { to: "/produits", className: "hover:text-foreground", children: "Catalogue" }), _jsx("span", { "aria-hidden": true, children: " / " }), _jsx("span", { className: "text-foreground", children: product.name })] }), _jsxs("div", { className: "mt-6 grid gap-10 lg:grid-cols-2", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "overflow-hidden rounded-3xl bg-secondary", children: _jsx("img", { src: displayedImage, alt: product.name, width: 900, height: 900, className: "aspect-square w-full object-cover transition-opacity duration-200" }, displayedImage) }), hasColorVariants && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Couleur :", " ", _jsx("span", { className: "font-medium text-foreground", children: activeColor ?? product.colorVariants[0]?.color })] }), _jsx("div", { className: "flex flex-wrap gap-3", role: "group", "aria-label": "Choisir une couleur", children: product.colorVariants.map((variant) => {
                                                    const swatchColor = COLOR_SWATCH_CSS[variant.color] ?? '#888888';
                                                    const isSelected = activeColor === variant.color || (activeColor === null && variant === product.colorVariants[0]);
                                                    return (_jsx("button", { type: "button", onClick: () => handleColorSelect(variant.color, variant.imageUrl), "aria-label": variant.color, "aria-pressed": isSelected, title: variant.color, className: cn("relative size-10 rounded-full border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", isSelected
                                                            ? "scale-110 border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
                                                            : "border-border hover:scale-105 hover:border-primary/60", variant.color === "White" && "border-border/60"), style: { backgroundColor: swatchColor }, children: variant.color === "White" && (_jsx("span", { className: "absolute inset-[3px] rounded-full border border-border/30" })) }, variant.color));
                                                }) })] }))] }), _jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: product.name }), product.category && (_jsx("p", { className: "mt-1 text-sm font-medium uppercase tracking-wider text-primary", children: product.category })), _jsxs("div", { className: "mt-3 flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Star, { className: "size-4 fill-accent text-accent" }), _jsx("span", { className: "font-medium text-foreground", children: product.rating.toFixed(1) }), _jsx("span", { children: "\u00B7 Avis v\u00E9rifi\u00E9s" })] }), _jsxs("div", { className: "mt-6 space-y-1", children: [_jsxs("div", { className: "flex items-end gap-3", children: [_jsx("p", { className: "font-display text-3xl font-semibold", children: formatTND(product.price) }), product.compareAtPrice ? (_jsx("p", { className: "pb-1 text-muted-foreground line-through", children: formatTND(product.compareAtPrice) })) : null] }), product.deliveryFee != null && (_jsxs("p", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Truck, { className: "size-3.5 shrink-0" }), "Livraison :", " ", _jsx("span", { className: "font-medium text-foreground", children: formatTND(product.deliveryFee) })] }))] }), _jsx("p", { className: "mt-2 text-sm", children: product.stock > 0 ? (_jsxs("span", { className: "font-medium text-success", children: ["En stock \u2014 ", product.stock, " unit\u00E9(s)"] })) : (_jsx("span", { className: "font-medium text-destructive", children: "Rupture de stock" })) }), _jsx("p", { className: "mt-6 leading-relaxed text-muted-foreground", dir: "auto", children: product.description }), _jsx(Separator, { className: "my-6" }), hasSizes && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm font-medium", children: ["Taille", " ", activeSize && (_jsx("span", { className: "ml-1 font-semibold text-foreground", children: activeSize }))] }), _jsx("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": "Choisir une taille", children: product.sizes.map((size) => (_jsx("button", { type: "button", onClick: () => {
                                                        setActiveSize(size);
                                                        setSizeError(false);
                                                    }, "aria-pressed": activeSize === size, className: cn("min-w-[2.75rem] rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all", activeSize === size
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border hover:border-primary/60 hover:bg-muted"), children: size }, size))) }), sizeError && (_jsx("p", { className: "text-xs text-destructive", role: "alert", children: "Veuillez choisir une taille." }))] })), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center rounded-xl border", children: [_jsx("button", { type: "button", onClick: () => setSelectorQty((q) => Math.max(1, q - 1)), className: "flex size-10 items-center justify-center rounded-l-xl hover:bg-muted", "aria-label": "Diminuer la quantit\u00E9", children: _jsx(Minus, { className: "size-4" }) }), _jsx("span", { className: "w-10 text-center text-sm font-semibold", children: selectorQty }), _jsx("button", { type: "button", onClick: () => setSelectorQty((q) => Math.min(20, q + 1)), className: "flex size-10 items-center justify-center rounded-r-xl hover:bg-muted", "aria-label": "Augmenter la quantit\u00E9", children: _jsx(Plus, { className: "size-4" }) })] }), hasSizes ? (_jsxs(Button, { variant: "outline", disabled: product.stock === 0, onClick: handleAddVariant, children: [_jsx(Plus, { className: "size-4" }), "Ajouter cette variante"] })) : null, _jsxs(Button, { size: "lg", disabled: product.stock === 0 || (hasSizes && pendingLines.length === 0 && !activeSize), onClick: handleCommitToCart, children: [_jsx(ShoppingBag, { className: "size-4" }), pendingLines.length > 0 ? `Ajouter au panier (${pendingLines.reduce((s, l) => s + l.quantity, 0)})` : "Ajouter au panier"] }), _jsxs(Button, { size: "lg", variant: "outline", onClick: () => toggleFavorite(product.id), "aria-pressed": isFavorite(product.id), children: [_jsx(Heart, { className: cn("size-4", isFavorite(product.id) && "fill-destructive text-destructive") }), "Favori"] })] }), pendingLines.length > 0 && (_jsxs("div", { className: "mt-6 space-y-3", children: [_jsx("p", { className: "text-sm font-semibold", children: "Variantes s\u00E9lectionn\u00E9es" }), _jsx("ul", { className: "space-y-2", children: pendingLines.map((line) => (_jsxs("li", { className: "flex items-center gap-3 rounded-2xl border p-3", children: [line.colorImageUrl ? (_jsx("img", { src: line.colorImageUrl, alt: line.color, className: "size-10 shrink-0 rounded-xl object-cover" })) : (_jsx("div", { className: "size-10 shrink-0 rounded-xl border", style: { backgroundColor: COLOR_SWATCH_CSS[line.color] ?? '#888' } })), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-0.5", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium", children: [line.color && _jsx("span", { children: line.color }), line.color && line.size && _jsx("span", { className: "text-muted-foreground", children: "\u2014" }), line.size && _jsx(Badge, { variant: "secondary", children: line.size })] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formatTND(product.price), " / unit\u00E9"] })] }), _jsxs("div", { className: "flex items-center rounded-lg border text-sm", children: [_jsx("button", { type: "button", onClick: () => setPendingLines((prev) => prev.map((l) => l.color === line.color && l.size === line.size
                                                                        ? { ...l, quantity: Math.max(1, l.quantity - 1) }
                                                                        : l)), className: "flex size-8 items-center justify-center hover:bg-muted", "aria-label": "Diminuer", children: _jsx(Minus, { className: "size-3" }) }), _jsx("span", { className: "w-8 text-center font-semibold", children: line.quantity }), _jsx("button", { type: "button", onClick: () => setPendingLines((prev) => prev.map((l) => l.color === line.color && l.size === line.size
                                                                        ? { ...l, quantity: Math.min(20, l.quantity + 1) }
                                                                        : l)), className: "flex size-8 items-center justify-center hover:bg-muted", "aria-label": "Augmenter", children: _jsx(Plus, { className: "size-3" }) })] }), _jsx("button", { type: "button", onClick: () => setPendingLines((prev) => prev.filter((l) => !(l.color === line.color && l.size === line.size))), "aria-label": "Supprimer cette variante", className: "ml-1 text-muted-foreground hover:text-destructive", children: _jsx(Trash2, { className: "size-4" }) })] }, `${line.color}|${line.size}`))) })] })), _jsxs("div", { className: "mt-8 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx(Truck, { className: "size-5 shrink-0 text-primary" }), _jsx("p", { className: "text-sm", children: "Livraison 48\u201372 h partout en Tunisie" })] }), _jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx(ShieldCheck, { className: "size-5 shrink-0 text-primary" }), _jsx("p", { className: "text-sm", children: "Paiement \u00E0 la livraison s\u00E9curis\u00E9" })] })] }), product.deliveryFee != null && (_jsxs("div", { className: "mt-4 surface-card space-y-2 p-4 text-sm", children: [_jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsx("span", { children: "Produit" }), _jsx("span", { children: formatTND(product.price) })] }), _jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsx("span", { children: "Livraison" }), _jsx("span", { children: formatTND(product.deliveryFee) })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex justify-between font-semibold", children: [_jsx("span", { children: "Total estim\u00E9" }), _jsx("span", { children: formatTND(product.price + product.deliveryFee) })] })] }))] })] })] })) }) }));
}
