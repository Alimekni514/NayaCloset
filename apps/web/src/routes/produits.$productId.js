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
    return (_jsx(StoreLayout, { children: _jsx("div", { className: "mx-auto max-w-7xl px-4 py-10 sm:px-6", children: isLoading ? (_jsx(LoadingSkeleton, { count: 4 })) : error || !product ? (_jsx(ErrorState, { message: "Ce produit n'existe pas ou n'est plus disponible.", onRetry: () => refetch() })) : (_jsxs(_Fragment, { children: [_jsxs("nav", { className: "text-sm text-muted-foreground", children: [_jsx(Link, { to: "/produits", className: "hover:text-foreground", children: "Catalogue" }), _jsx("span", { "aria-hidden": true, children: " / " }), _jsx("span", { className: "text-foreground", children: product.name })] }), _jsxs("div", { className: "mt-6 grid gap-10 lg:grid-cols-2", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "overflow-hidden rounded-3xl bg-secondary", children: _jsx("img", { src: product.images[activeImage], alt: product.name, width: 900, height: 900, className: "aspect-square w-full object-cover" }) }), _jsx("div", { className: "flex gap-3", children: product.images.map((image, index) => (_jsx("button", { type: "button", onClick: () => setActiveImage(index), "aria-label": `Image ${index + 1}`, "aria-current": activeImage === index, className: cn("size-20 overflow-hidden rounded-2xl border-2 transition-colors", activeImage === index ? "border-primary" : "border-transparent"), children: _jsx("img", { src: image, alt: "", loading: "lazy", className: "size-full object-cover" }) }, index))) })] }), _jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: product.name }), _jsxs("div", { className: "mt-3 flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Star, { className: "size-4 fill-accent text-accent" }), _jsx("span", { className: "font-medium text-foreground", children: product.rating.toFixed(1) }), _jsx("span", { children: "\u00B7 Avis v\u00E9rifi\u00E9s" })] }), _jsxs("div", { className: "mt-6 flex items-end gap-3", children: [_jsx("p", { className: "font-display text-3xl font-semibold", children: formatTND(product.price) }), product.compareAtPrice ? (_jsx("p", { className: "pb-1 text-muted-foreground line-through", children: formatTND(product.compareAtPrice) })) : null] }), _jsx("p", { className: "mt-2 text-sm", children: product.stock > 0 ? (_jsxs("span", { className: "font-medium text-success", children: ["En stock \u2014 ", product.stock, " unit\u00E9(s)"] })) : (_jsx("span", { className: "font-medium text-destructive", children: "Rupture de stock" })) }), _jsx("p", { className: "mt-6 leading-relaxed text-muted-foreground", children: product.description }), _jsx(Separator, { className: "my-6" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx(QuantitySelector, { value: quantity, max: Math.max(1, product.stock), onChange: setQuantity }), _jsxs(Button, { size: "lg", disabled: product.stock === 0, onClick: () => {
                                                    addToCart(product.id, quantity);
                                                    setCartOpen(true);
                                                    toast.success("Ajouté au panier", { description: product.name });
                                                }, children: [_jsx(ShoppingBag, { className: "size-4" }), "Ajouter au panier"] }), _jsxs(Button, { size: "lg", variant: "outline", onClick: () => toggleFavorite(product.id), "aria-pressed": isFavorite(product.id), children: [_jsx(Heart, { className: cn("size-4", isFavorite(product.id) && "fill-destructive text-destructive") }), "Favori"] })] }), _jsxs("div", { className: "mt-8 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx(Truck, { className: "size-5 shrink-0 text-primary" }), _jsx("p", { className: "text-sm", children: "Livraison 48\u201372 h partout en Tunisie" })] }), _jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx(ShieldCheck, { className: "size-5 shrink-0 text-primary" }), _jsx("p", { className: "text-sm", children: "Paiement \u00E0 la livraison s\u00E9curis\u00E9" })] })] })] })] })] })) }) }));
}
