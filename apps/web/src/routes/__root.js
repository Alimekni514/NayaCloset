import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { StoreProvider } from '@/features/store/store-context';
export const Route = createRootRouteWithContext()({
    head: () => ({
        meta: [
            { title: 'Dar Souk' },
            {
                name: 'description',
                content: 'Boutique en ligne livree partout en Tunisie avec paiement a la livraison.',
            },
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
});
function RootComponent() {
    return (_jsxs(StoreProvider, { children: [_jsx(Outlet, {}), _jsx(Toaster, { position: "top-center", richColors: true })] }));
}
function NotFoundComponent() {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: _jsxs("div", { className: "max-w-md text-center", children: [_jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }), _jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page introuvable" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "La page demandee n'existe pas ou n'est plus disponible." })] }) }));
}
function ErrorComponent({ error, reset }) {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: _jsxs("div", { className: "max-w-md text-center", children: [_jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "Cette page n'a pas pu se charger" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }), _jsx("button", { type: "button", onClick: reset, className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90", children: "Reessayer" })] }) }));
}
