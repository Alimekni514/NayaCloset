import { createFileRoute } from '@tanstack/react-router';
import { Package, RefreshCw, RotateCcw, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAbmDashboard } from '@/features/admin/abm-dashboard';
import {
  AbmDashboardFilters,
  AbmDashboardInfoBanner,
  AbmDashboardSection,
  AbmDashboardSkeleton,
  AbmDashboardTotalCard,
} from '@/features/admin/abm-dashboard';
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
  const [filters, setFilters] = useState<{ from?: string; to?: string }>({});
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Tableau de bord ABM</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vue d&apos;ensemble des operations de livraison, retour et echange.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {dashboard?.syncedAt ? (
            <p className="text-sm text-muted-foreground">
              Derniere synchronisation : {new Date(dashboard.syncedAt).toLocaleString('fr-FR')}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void dashboardQuery.refetch()}
            disabled={dashboardQuery.isRefetching}
          >
            {dashboardQuery.isRefetching ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            {dashboardQuery.isRefetching ? 'Actualisation...' : 'Rafraichir'}
          </Button>
        </div>
      </header>

      <AbmDashboardFilters
        initialFrom={filters.from ?? ''}
        initialTo={filters.to ?? ''}
        onApply={(next) => setFilters(next)}
        onReset={() => setFilters({})}
        disabled={dashboardQuery.isLoading}
      />

      <AbmDashboardInfoBanner
        from={dashboard?.period.from ?? null}
        to={dashboard?.period.to ?? null}
        filtered={dashboard?.period.filtered ?? false}
      />

      {dashboardQuery.isLoading && !dashboard ? (
        <AbmDashboardSkeleton />
      ) : dashboardQuery.isError && !dashboard ? (
        <ErrorState message={safeErrorMessage} onRetry={() => void dashboardQuery.refetch()} />
      ) : dashboard ? (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AbmDashboardTotalCard label="Total Position" value={dashboard.totals.positions} icon={Package} />
            <AbmDashboardTotalCard label="Total Retour" value={dashboard.totals.returns} icon={RotateCcw} />
            <AbmDashboardTotalCard label="Total Echange" value={dashboard.totals.exchanges} icon={Truck} />
          </div>

          <AbmDashboardSection
            group="POSITION"
            events={dashboard.groups.POSITION}
            filtered={dashboard.period.filtered}
          />
          <AbmDashboardSection
            group="RETOUR"
            events={dashboard.groups.RETOUR}
            filtered={dashboard.period.filtered}
          />
          <AbmDashboardSection
            group="ECHANGE"
            events={dashboard.groups.ECHANGE}
            filtered={dashboard.period.filtered}
          />
        </div>
      ) : null}

      {dashboardQuery.isError && dashboard ? (
        <ErrorState message={safeErrorMessage} onRetry={() => void dashboardQuery.refetch()} />
      ) : null}
    </div>
  );
}
