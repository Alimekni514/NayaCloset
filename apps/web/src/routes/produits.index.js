import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useCategories, useProducts } from "@/features/shared/queries";
import { formatTND } from "@/lib/format";
const buildCatalogSearch = (input) => ({
    ...(input.q ? { q: input.q } : {}),
    ...(input.categorie ? { categorie: input.categorie } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.tri ? { tri: input.tri } : {}),
});
export const Route = createFileRoute("/produits/")({
    validateSearch: (search) => buildCatalogSearch({
        q: typeof search.q === "string" && search.q ? search.q : undefined,
        categorie: typeof search.categorie === "string" && search.categorie ? search.categorie : undefined,
        max: Number(search.max) > 0 ? Number(search.max) : undefined,
        tri: ["recent", "price-asc", "price-desc", "rating"].includes(search.tri)
            ? search.tri
            : undefined,
    }),
    head: () => ({
        meta: [
            { title: "Catalogue — Dar Souk" },
            {
                name: "description",
                content: "Parcourez tous les produits Dar Souk : filtres par catégorie, prix et tri, prix en TND.",
            },
            { property: "og:title", content: "Catalogue Dar Souk" },
            { property: "og:description", content: "Recherchez, filtrez et commandez en quelques clics." },
        ],
    }),
    component: CatalogPage,
});
const MAX_PRICE = 1200;
function CatalogPage() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const { data: categories } = useCategories();
    const categoryId = categories?.find((c) => c.slug === search.categorie)?.id ?? null;
    const { data: products, isLoading, error } = useProducts({
        ...(search.q ? { search: search.q } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(search.max !== undefined ? { maxPrice: search.max } : {}),
        sort: search.tri ?? "recent",
    });
    const update = (patch) => navigate({
        to: ".",
        search: (prev) => buildCatalogSearch({
            q: patch.q !== undefined ? patch.q : prev.q,
            categorie: patch.categorie !== undefined ? patch.categorie : prev.categorie,
            max: patch.max !== undefined ? patch.max : prev.max,
            tri: patch.tri !== undefined ? patch.tri : prev.tri,
        }),
    });
    return (_jsx(StoreLayout, { children: _jsxs("div", { className: "mx-auto max-w-7xl px-4 py-10 sm:px-6", children: [_jsxs("header", { className: "max-w-2xl", children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Catalogue" }), _jsxs("p", { className: "mt-2 text-muted-foreground", children: [products?.length ?? 0, " produit(s) disponibles, livr\u00E9s partout en Tunisie."] })] }), _jsxs("div", { className: "mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]", children: [_jsxs("aside", { className: "surface-card h-fit space-y-6 p-5 lg:sticky lg:top-28", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [_jsx(SlidersHorizontal, { className: "size-4" }), " Filtres"] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "search", children: "Recherche" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { id: "search", value: search.q ?? "", placeholder: "Nom du produit\u2026", className: "pl-9", onChange: (event) => update({ q: event.target.value || undefined }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "category", children: "Cat\u00E9gorie" }), _jsxs(Select, { value: search.categorie ?? "all", onValueChange: (value) => update({ categorie: value === "all" ? undefined : value }), children: [_jsx(SelectTrigger, { id: "category", children: _jsx(SelectValue, { placeholder: "Toutes" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Toutes les cat\u00E9gories" }), categories?.map((category) => (_jsx(SelectItem, { value: category.slug, children: category.name }, category.id)))] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "price", children: "Prix maximum" }), _jsx(Slider, { id: "price", min: 50, max: MAX_PRICE, step: 10, value: [search.max ?? MAX_PRICE], onValueChange: ([value]) => update({ max: value === MAX_PRICE ? undefined : value }) }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Jusqu'\u00E0 ", formatTND(search.max ?? MAX_PRICE)] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "sort", children: "Trier par" }), _jsxs(Select, { value: search.tri ?? "recent", onValueChange: (value) => update({ tri: value }), children: [_jsx(SelectTrigger, { id: "sort", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "recent", children: "Nouveaut\u00E9s" }), _jsx(SelectItem, { value: "price-asc", children: "Prix croissant" }), _jsx(SelectItem, { value: "price-desc", children: "Prix d\u00E9croissant" }), _jsx(SelectItem, { value: "rating", children: "Mieux not\u00E9s" })] })] })] }), _jsx(Button, { variant: "outline", className: "w-full", onClick: () => navigate({ to: ".", search: {} }), children: "R\u00E9initialiser" })] }), _jsx(ProductGrid, { products: products, isLoading: isLoading, error: error })] })] }) }));
}
