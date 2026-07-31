import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useProductsByIds } from "@/features/shared/queries";
import { useStore } from "@/features/store/store-context";
export const Route = createFileRoute("/favoris")({
    head: () => ({
        meta: [
            { title: "Mes favoris — Dar Souk" },
            { name: "description", content: "Retrouvez les produits Dar Souk que vous avez enregistrés." },
            { property: "og:title", content: "Mes favoris — Dar Souk" },
            { property: "og:description", content: "Vos produits enregistrés, prêts à commander." },
        ],
    }),
    component: FavoritesPage,
});
function FavoritesPage() {
    const { favorites } = useStore();
    const { data: products, isLoading, error } = useProductsByIds(favorites);
    return (_jsx(StoreLayout, { children: _jsxs("div", { className: "mx-auto max-w-7xl px-4 py-10 sm:px-6", children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Mes favoris" }), _jsxs("p", { className: "mt-2 text-muted-foreground", children: [favorites.length, " produit(s) enregistr\u00E9(s)."] }), _jsx("div", { className: "mt-8", children: favorites.length === 0 ? (_jsx(EmptyState, { icon: Heart, title: "Aucun favori pour le moment", description: "Touchez le c\u0153ur sur un produit pour le retrouver ici.", action: _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/produits", children: "Parcourir le catalogue" }) }) })) : (_jsx(ProductGrid, { products: products, isLoading: isLoading, error: error })) })] }) }));
}
