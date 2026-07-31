import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, createFileRoute } from '@tanstack/react-router';
import { Package } from 'lucide-react';
import { AuthGuard, useCurrentUser } from '@/features/auth';
import { useCustomerOrders } from '@/features/shared/queries';
import { formatDate, formatTND } from '@/lib/format';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/compte/commandes/')({
    head: () => ({
        meta: [
            { title: 'Mes commandes - Dar Souk' },
            {
                name: 'description',
                content: 'Historique de vos commandes Dar Souk et statut de livraison.',
            },
        ],
    }),
    component: OrderHistoryPage,
});
function OrderHistoryPage() {
    const { user } = useCurrentUser();
    const { data: orders, isLoading, error } = useCustomerOrders(user?.id ?? '');
    return (_jsx(StoreLayout, { children: _jsx(AuthGuard, { children: _jsxs("div", { className: "mx-auto max-w-4xl px-4 py-10 sm:px-6", children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Mes commandes" }), _jsx("div", { className: "mt-8", children: isLoading ? (_jsx(LoadingSkeleton, { count: 4 })) : error ? (_jsx(ErrorState, { message: error.message })) : !orders?.length ? (_jsx(EmptyState, { icon: Package, title: "Aucune commande", description: "Vos commandes apparaitront ici apres votre premier achat.", action: _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/produits", children: "Commencer mes achats" }) }) })) : (_jsx("ul", { className: "space-y-4", children: orders.map((order) => (_jsx("li", { children: _jsxs(Link, { to: "/compte/commandes/$orderId", params: { orderId: order.id }, className: "surface-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 transition-shadow hover:shadow-lift", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-semibold", children: order.reference }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [formatDate(order.createdAt), " - ", order.items.length, " article(s)"] }), _jsx("div", { className: "mt-2", children: _jsx(OrderStatusBadge, { status: order.status }) })] }), _jsx("p", { className: "shrink-0 font-display text-lg font-semibold", children: formatTND(order.total) })] }) }, order.id))) })) })] }) }) }));
}
