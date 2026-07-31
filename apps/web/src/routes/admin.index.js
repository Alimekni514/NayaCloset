import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { Package, RefreshCw, RotateCcw, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAbmDashboard } from '@/features/admin/abm-dashboard';
import { AbmDashboardFilters, AbmDashboardInfoBanner, AbmDashboardSection, AbmDashboardSkeleton, AbmDashboardTotalCard, } from '@/features/admin/abm-dashboard';
import { ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { apiErrorUtils } from '@/lib/api-client';
export const Route = createFileRoute('/admin/')({
    head: () => ({
        meta: [
            { title: 'Tableau de bord ABM - Dar Souk' },
            {
                name: 'description',
                content: "Vue d'ensemble des operations de livraison, retour et echange.",
            },
        ],
    }),
    component: AdminDashboardPage,
});
export function AdminDashboardPage() {
    const [filters, setFilters] = useState({});
    const dashboardQuery = useAbmDashboard(filters);
    const dashboard = dashboardQuery.data;
    const safeErrorMessage = useMemo(() => {
        if (!dashboardQuery.error || !apiErrorUtils.isApiError(dashboardQuery.error)) {
            return 'Impossible de charger les statistiques ABM pour le moment.';
        }
        return dashboardQuery.error.status === 503
            ? "L'integration ABM n'est pas configuree."
            : 'Impossible de charger les statistiques ABM pour le moment.';
    }, [dashboardQuery.error]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Tableau de bord ABM" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Vue d'ensemble des operations de livraison, retour et echange." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [dashboard?.syncedAt ? (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Derniere synchronisation : ", new Date(dashboard.syncedAt).toLocaleString('fr-FR')] })) : null, _jsxs(Button, { type: "button", variant: "outline", onClick: () => void dashboardQuery.refetch(), disabled: dashboardQuery.isRefetching, children: [dashboardQuery.isRefetching ? (_jsx(RefreshCw, { className: "size-4 animate-spin" })) : (_jsx(RotateCcw, { className: "size-4" })), dashboardQuery.isRefetching ? 'Actualisation...' : 'Rafraichir'] })] })] }), _jsx(AbmDashboardFilters, { initialFrom: filters.from ?? '', initialTo: filters.to ?? '', onApply: (next) => setFilters(next), onReset: () => setFilters({}), disabled: dashboardQuery.isLoading }), _jsx(AbmDashboardInfoBanner, { from: dashboard?.period.from ?? null, to: dashboard?.period.to ?? null, filtered: dashboard?.period.filtered ?? false }), dashboardQuery.isLoading && !dashboard ? (_jsx(AbmDashboardSkeleton, {})) : dashboardQuery.isError && !dashboard ? (_jsx(ErrorState, { message: safeErrorMessage, onRetry: () => void dashboardQuery.refetch() })) : dashboard ? (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: [_jsx(AbmDashboardTotalCard, { label: "Total Position", value: dashboard.totals.positions, icon: Package }), _jsx(AbmDashboardTotalCard, { label: "Total Retour", value: dashboard.totals.returns, icon: RotateCcw }), _jsx(AbmDashboardTotalCard, { label: "Total Echange", value: dashboard.totals.exchanges, icon: Truck })] }), _jsx(AbmDashboardSection, { group: "POSITION", events: dashboard.groups.POSITION, filtered: dashboard.period.filtered }), _jsx(AbmDashboardSection, { group: "RETOUR", events: dashboard.groups.RETOUR, filtered: dashboard.period.filtered }), _jsx(AbmDashboardSection, { group: "ECHANGE", events: dashboard.groups.ECHANGE, filtered: dashboard.period.filtered })] })) : null, dashboardQuery.isError && dashboard ? (_jsx(ErrorState, { message: safeErrorMessage, onRetry: () => void dashboardQuery.refetch() })) : null] }));
}
