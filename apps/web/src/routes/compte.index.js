import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogOut, Package } from 'lucide-react';
import { AuthGuard, useCurrentUser, useLogout } from '@/features/auth';
import { useCustomerOrders } from '@/features/shared/queries';
import { formatTND } from '@/lib/format';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/compte/')({
    head: () => ({
        meta: [
            { title: 'Mon compte - Dar Souk' },
            {
                name: 'description',
                content: 'Gerez vos informations personnelles et consultez vos commandes.',
            },
        ],
    }),
    component: AccountPage,
});
function AccountPage() {
    const navigate = useNavigate();
    const { user } = useCurrentUser();
    const logout = useLogout();
    const { data: orders } = useCustomerOrders(user?.id ?? '');
    const spent = orders?.reduce((sum, order) => sum + order.total, 0) ?? 0;
    return (_jsx(StoreLayout, { children: _jsx(AuthGuard, { children: _jsxs("div", { className: "mx-auto max-w-4xl px-4 py-10 sm:px-6", children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Mon compte" }), _jsxs("div", { className: "mt-8 space-y-6", children: [_jsx("section", { className: "surface-card p-6", children: _jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "font-display text-xl font-semibold", children: [user?.firstName, " ", user?.lastName] }), _jsx("p", { className: "truncate text-sm text-muted-foreground", children: user?.email })] }), _jsxs(Button, { variant: "outline", onClick: async () => {
                                                await logout.mutateAsync().catch(() => undefined);
                                                navigate({ to: '/' });
                                            }, children: [_jsx(LogOut, { className: "size-4" }), "Deconnexion"] })] }) }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "surface-card p-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Commandes" }), _jsx("p", { className: "mt-1 font-display text-2xl font-semibold", children: orders?.length ?? 0 })] }), _jsxs("div", { className: "surface-card p-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total depense" }), _jsx("p", { className: "mt-1 font-display text-2xl font-semibold", children: formatTND(spent) })] })] }), _jsx(Button, { asChild: true, size: "lg", children: _jsxs(Link, { to: "/compte/commandes", children: [_jsx(Package, { className: "size-4" }), "Voir mes commandes"] }) })] })] }) }) }));
}
