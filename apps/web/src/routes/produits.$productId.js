import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { QuantitySelector } from "@/components/store/QuantitySelector";
import { Button } from "@/components/ui/button";
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
            { property: "og:title", content: "Fiche produit — Dar Souk" },
            { property: "og:description", content: "Galerie, description, disponibilité et ajout au panier." },
        ],
    }),
    component: ProductPage,
});
function ProductPage() {
    const { productId } = Route.useParams();
    const { data: product, isLoading, error, refetch } = useProduct(productId);
    const { addToCart, toggleFavorite, isFavorite, setCartOpen } = useStore();
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [activeColor, setActiveColor] = useState(null);
    const hasColorVariants = product?.colorVariants && product.colorVariants.length > 0;
    // Resolve the displayed image: if a color is selected use that variant's image,
    // otherwise use the thumbnail index from the plain images array.
    const displayedImage = (() => {
        if (!product)
            return undefined;
        if (hasColorVariants && activeColor !== null) {
            const variant = product.colorVariants.find((v) => v.color === activeColor);
            return variant?.imageUrl ?? product.images[activeImage];
        }
        return product.images[activeImage];
    })();
    const handleColorSelect = (color, imageUrl) => {
        setActiveColor(color);
        // Also update activeImage so the thumbnail strip (if shown) stays consistent
        if (!hasColorVariants)
            return;
        const idx = product.colorVariants.findIndex((v) => v.color === color);
        if (idx !== -1)
            setActiveImage(idx);
        // Prefetch the image so the swap is instant (browser caches it)
        const img = new Image();
        img.src = imageUrl;
    };
    return (_jsx(StoreLayout, { children: _jsx("div", { className: "mx-auto max-w-7xl px-4 py-10 sm:px-6", children: isLoading ? (_jsx(LoadingSkeleton, { count: 4 })) : error || !product ? (_jsx(ErrorState, { message: "Ce produit n'existe pas ou n'est plus disponible.", onRetry: () => refetch() })) : (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "text-sm text-muted-foreground", children: [_jsx(Link, { to: "/produits", className: "hover:text-foreground", children: "Catalogue" }), _jsx("span", { "aria-hidden": true, children: " / " }), _jsx("span", { className: "text-foreground", children: product.name })] }), _jsxs("div", { className: "mt-6 grid gap-10 lg:grid-cols-2", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "overflow-hidden rounded-3xl bg-secondary", children: _jsx("img", { src: displayedImage, alt: product.name, width: 900, height: 900, className: "aspect-square w-full object-cover transition-opacity duration-200" }, displayedImage) }), hasColorVariants ? (_jsx("div", { className: "flex flex-wrap gap-3", role: "group", "aria-label": "Choisir une couleur", children: product.colorVariants.map((variant) => {
                                            const swatchColor = COLOR_SWATCH_CSS[variant.color] ?? '#888888';
                                            const isSelected = activeColor === variant.color || (activeColor === null && variant === product.colorVariants[0]);
                                            return (_jsx("button", { type: "button", onClick: () => handleColorSelect(variant.color, variant.imageUrl), "aria-label": variant.color, "aria-pressed": isSelected, title: variant.color, className: cn("relative size-10 rounded-full border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", isSelected
                                                    ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)] scale-110"
                                                    : "border-border hover:border-primary/60 hover:scale-105", variant.color === "White" && "border-border/60"), style: { backgroundColor: swatchColor }, children: variant.color === "White" && (_jsx("span", { className: "absolute inset-[3px] rounded-full border border-border/30" })) }, variant.color));
                                        }) })) : (
                                    /* Thumbnail strip for products without color variants */
                                    _jsx("div", { className: "flex gap-3", children: product.images.map((image, index) => (_jsx("button", { type: "button", onClick: () => setActiveImage(index), "aria-label": `Image ${index + 1}`, "aria-current": activeImage === index, className: cn("size-20 overflow-hidden rounded-2xl border-2 transition-colors", activeImage === index ? "border-primary" : "border-transparent"), children: _jsx("img", { src: image, alt: "", loading: "lazy", className: "size-full object-cover" }) }, index))) })), hasColorVariants && (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Couleur :", " ", _jsx("span", { className: "font-medium text-foreground", children: activeColor ?? product.colorVariants?.[0]?.color })] }))] }), _jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: product.name }), product.category && (_jsx("p", { className: "mt-1 text-sm font-medium uppercase tracking-wider text-primary", children: product.category })), _jsxs("div", { className: "mt-3 flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Star, { className: "size-4 fill-accent text-accent" }), _jsx("span", { className: "font-medium text-foreground", children: product.rating.toFixed(1) }), _jsx("span", { children: "\u00B7 Avis v\u00E9rifi\u00E9s" })] }), _jsxs("div", { className: "mt-6 space-y-1", children: [_jsxs("div", { className: "flex items-end gap-3", children: [_jsx("p", { className: "font-display text-3xl font-semibold", children: formatTND(product.price) }), product.compareAtPrice ? (_jsx("p", { className: "pb-1 text-muted-foreground line-through", children: formatTND(product.compareAtPrice) })) : null] }), product.deliveryFee != null && (_jsxs("p", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Truck, { className: "size-3.5 shrink-0" }), "Livraison :", " ", _jsx("span", { className: "font-medium text-foreground", children: formatTND(product.deliveryFee) })] }))] }), _jsx("p", { className: "mt-2 text-sm", children: product.stock > 0 ? (_jsxs("span", { className: "font-medium text-success", children: ["En stock \u2014 ", product.stock, " unit\u00E9(s)"] })) : (_jsx("span", { className: "font-medium text-destructive", children: "Rupture de stock" })) }), _jsx("p", { className: "mt-6 leading-relaxed text-muted-foreground", dir: "auto", lang: "ar", children: product.description }), _jsx(Separator, { className: "my-6" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx(QuantitySelector, { value: quantity, max: Math.max(1, product.stock), onChange: setQuantity }), _jsxs(Button, { size: "lg", disabled: product.stock === 0, onClick: () => {
                                                    addToCart(product.id, quantity);
                                                    setCartOpen(true);
                                                    toast.success("Ajouté au panier", { description: product.name });
                                                }, children: [_jsx(ShoppingBag, { className: "size-4" }), "Ajouter au panier"] }), _jsxs(Button, { size: "lg", variant: "outline", onClick: () => toggleFavorite(product.id), "aria-pressed": isFavorite(product.id), children: [_jsx(Heart, { className: cn("size-4", isFavorite(product.id) && "fill-destructive text-destructive") }), "Favori"] })] }), _jsxs("div", { className: "mt-8 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx(Truck, { className: "size-5 shrink-0 text-primary" }), _jsx("p", { className: "text-sm", children: "Livraison 48\u201372 h partout en Tunisie" })] }), _jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx(ShieldCheck, { className: "size-5 shrink-0 text-primary" }), _jsx("p", { className: "text-sm", children: "Paiement \u00E0 la livraison s\u00E9curis\u00E9" })] })] }), product.deliveryFee != null && (_jsxs("div", { className: "mt-4 surface-card p-4 space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsx("span", { children: "Produit" }), _jsx("span", { children: formatTND(product.price) })] }), _jsxs("div", { className: "flex justify-between text-muted-foreground", children: [_jsx("span", { children: "Livraison" }), _jsx("span", { children: formatTND(product.deliveryFee) })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex justify-between font-semibold", children: [_jsx("span", { children: "Total estim\u00E9" }), _jsx("span", { children: formatTND(product.price + product.deliveryFee) })] })] }))] })] })] })) }) }));
}
