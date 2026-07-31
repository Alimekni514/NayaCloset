import { Banknote, CircleCheckBig, Package, TriangleAlert } from 'lucide-react';

import { StatCard } from '@/components/common/StatCard';
import { formatTND } from '@/lib/format';

import type { AbmPositionsResponse } from '@delivery-commerce/shared';

interface Props {
  summary?: AbmPositionsResponse['summary'];
  loading?: boolean;
}

export function PositionsSummary({ summary, loading }: Props) {
  const isLoading = loading === true;
  const displayedCount = summary?.total ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Positions affichees"
        value={displayedCount}
        icon={Package}
        {...(isLoading ? { loading: true } : {})}
      />
      <StatCard
        label="Montant COD total"
        value={summary ? formatTND(summary.totalCod) : '-'}
        icon={Banknote}
        {...(isLoading ? { loading: true } : {})}
      />
      <StatCard
        label="Livrees"
        value={summary?.delivered ?? 0}
        icon={CircleCheckBig}
        tone="success"
        {...(isLoading ? { loading: true } : {})}
      />
      <StatCard
        label="En anomalie"
        value={summary?.anomalies ?? 0}
        icon={TriangleAlert}
        tone="danger"
        {...(isLoading ? { loading: true } : {})}
      />
    </div>
  );
}
