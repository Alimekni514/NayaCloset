import { createFileRoute } from '@tanstack/react-router';

import { PositionWizard, usePositionFormOptions } from '@/features/admin/abm-position-create';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { apiErrorUtils } from '@/lib/api-client';

export const Route = createFileRoute('/admin/positions/nouvelle')({
  head: () => ({
    meta: [
      { title: 'Nouvelle position - Dar Souk Admin' },
      {
        name: 'description',
        content: 'Creation d une expedition ABM en quatre etapes.',
      },
    ],
  }),
  component: AdminPositionCreatePage,
});

export function AdminPositionCreatePage() {
  const optionsQuery = usePositionFormOptions();

  if (optionsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Nouvelle position</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Creez une expedition ABM en quatre etapes.
          </p>
        </header>
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  if (optionsQuery.isError || !optionsQuery.data) {
    const message =
      optionsQuery.error && apiErrorUtils.isApiError(optionsQuery.error) && optionsQuery.error.status === 503
        ? "L'integration ABM n'est pas configuree."
        : 'Impossible de charger le formulaire ABM.';

    return <ErrorState message={message} onRetry={() => void optionsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Nouvelle position</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Creez une expedition ABM en quatre etapes.
        </p>
      </header>
      <PositionWizard options={optionsQuery.data} />
    </div>
  );
}
