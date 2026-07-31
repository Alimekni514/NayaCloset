import { Box } from 'lucide-react';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

import { formatMetric } from '../lib/position-detail-formatters';

export function PositionDimensionsCard({ position }: { position: AbmPositionDetail }) {
  const items = [
    ['Longueur', formatMetric(position.dimensions.lengthCm, 'cm')],
    ['Largeur', formatMetric(position.dimensions.widthCm, 'cm')],
    ['Hauteur', formatMetric(position.dimensions.heightCm, 'cm')],
    ['Volume', formatMetric(position.dimensions.volume, 'cm³')],
  ];

  return (
    <div className="surface-card rounded-3xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Box className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold">Dimensions</h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
