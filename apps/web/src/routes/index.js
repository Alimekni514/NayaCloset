import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Banknote, Truck } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/features/shared/queries";
export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "Dar Souk — Boutique en ligne livrée partout en Tunisie" },
            {
                name: "description",
                content: "Artisanat tunisien et objets tech sélectionnés avec soin. Livraison 48 h partout en Tunisie et paiement à la livraison.",
            },
            { property: "og:title", content: "Dar Souk — Boutique en ligne en Tunisie" },
            {
                property: "og:description",
                content: "Sélection premium livrée partout en Tunisie, paiement à la livraison, prix en TND.",
            },
        ],
    }),
    component: HomePage,
});
const PERKS = [
    { icon: Truck, title: "Livraison 48–72 h", text: "Dans les 24 gouvernorats" },
    { icon: Banknote, title: "Paiement à la livraison", text: "Payez en espèces à réception" },
    { icon: BadgeCheck, title: "Produits vérifiés", text: "Contrôle qualité avant expédition" },
];
function HomePage() {
    const { data: categories } = useCategories();
    const { data: products, isLoading, error } = useProducts({ sort: "rating" });
    const featured = products?.filter((p) => p.featured).slice(0, 4);
    return (_jsxs(StoreLayout, { children: [_jsx("section", { className: "mx-auto max-w-7xl px-4 pt-8 sm:px-6", children: _jsxs("div", { className: "relative overflow-hidden rounded-4xl", children: [_jsx("img", { src: heroImage, alt: "S\u00E9lection d'objets premium sur lin naturel", width: 1600, height: 1104, className: "h-[440px] w-full object-cover sm:h-[520px]" }), _jsx("div", { className: "absolute inset-0 bg-[image:var(--gradient-hero)]" }), _jsx("div", { className: "absolute inset-0 flex items-center", children: _jsxs("div", { className: "max-w-xl px-6 sm:px-12", children: [_jsx("span", { className: "inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground", children: "Nouvelle collection 2026" }), _jsx("h1", { className: "mt-4 font-display text-4xl font-semibold text-primary-foreground sm:text-5xl", children: "Le beau et l'utile, livr\u00E9s chez vous" }), _jsx("p", { className: "mt-4 text-base text-primary-foreground/85 sm:text-lg", children: "Artisanat tunisien et objets tech soigneusement s\u00E9lectionn\u00E9s. Paiement \u00E0 la livraison, partout en Tunisie." }), _jsx("div", { className: "mt-7 flex flex-wrap gap-3", children: _jsx(Button, { asChild: true, size: "lg", variant: "secondary", children: _jsxs(Link, { to: "/produits", children: ["D\u00E9couvrir le catalogue", _jsx(ArrowRight, { className: "size-4" })] }) }) })] }) })] }) }), _jsx("section", { className: "mx-auto mt-8 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6", children: PERKS.map((perk) => (_jsxs("div", { className: "surface-card flex items-center gap-3 p-4", children: [_jsx("span", { className: "grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary", children: _jsx(perk.icon, { className: "size-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-semibold", children: perk.title }), _jsx("p", { className: "truncate text-xs text-muted-foreground", children: perk.text })] })] }, perk.title))) }), _jsxs("section", { className: "mx-auto mt-16 max-w-7xl px-4 sm:px-6", children: [_jsx("h2", { className: "font-display text-2xl font-semibold sm:text-3xl", children: "Cat\u00E9gories" }), _jsx("div", { className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: categories?.map((category) => (_jsxs(Link, { to: "/produits", search: { categorie: category.slug }, className: "surface-card group flex flex-col justify-between gap-6 p-6 transition-shadow hover:shadow-lift", children: [_jsxs("div", { children: [_jsx("p", { className: "font-display text-lg font-semibold", children: category.name }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: category.description })] }), _jsxs("span", { className: "inline-flex items-center gap-2 text-sm font-semibold text-primary", children: ["Explorer ", _jsx(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-1" })] })] }, category.id))) })] }), _jsxs("section", { className: "mx-auto mt-16 max-w-7xl px-4 sm:px-6", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsx("h2", { className: "font-display text-2xl font-semibold sm:text-3xl", children: "Coups de c\u0153ur" }), _jsx(Button, { asChild: true, variant: "ghost", children: _jsxs(Link, { to: "/produits", children: ["Tout voir ", _jsx(ArrowRight, { className: "size-4" })] }) })] }), _jsx("div", { className: "mt-6", children: _jsx(ProductGrid, { products: featured, isLoading: isLoading, error: error }) })] }), _jsxs("section", { className: "mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3", children: [_jsxs("div", { className: "surface-card bg-primary p-8 text-primary-foreground lg:col-span-2", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-widest text-primary-foreground/70", children: "Offre du mois" }), _jsx("h3", { className: "mt-3 font-display text-3xl font-semibold", children: "Livraison offerte d\u00E8s 400 TND" }), _jsx("p", { className: "mt-2 max-w-lg text-primary-foreground/85", children: "Sur toutes les commandes r\u00E9gl\u00E9es \u00E0 la livraison, dans tous les gouvernorats." }), _jsx(Button, { asChild: true, variant: "secondary", className: "mt-6", children: _jsx(Link, { to: "/produits", children: "J'en profite" }) })] }), _jsxs("div", { className: "surface-card bg-accent p-8 text-accent-foreground", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-widest opacity-70", children: "Artisanat" }), _jsx("h3", { className: "mt-3 font-display text-2xl font-semibold", children: "Pi\u00E8ces uniques faites main" }), _jsx("p", { className: "mt-2 text-sm opacity-90", children: "Tapis, bois d'olivier et cuir travaill\u00E9s dans des ateliers familiaux." }), _jsx(Button, { asChild: true, variant: "outline", className: "mt-6 bg-transparent", children: _jsx(Link, { to: "/produits", search: { categorie: "maison" }, children: "Voir la s\u00E9lection" }) })] })] })] }));
}
