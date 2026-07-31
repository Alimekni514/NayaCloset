import { Flag, MapPin, Navigation } from 'lucide-react';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

import { formatDetailDateTime, formatOptionalText } from '../lib/position-detail-formatters';

export function PositionRouteCard({ position }: { position: AbmPositionDetail }) {
  return (
    <div className="surface-card rounded-3xl p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">Itinéraire</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
          <div className="flex items-center gap-3">
            <MapPin className="size-5 text-primary" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Départ
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold">{formatOptionalText(position.departure.displayLabel)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDetailDateTime(position.pickupDate ?? position.createdAt)}
          </p>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <div className="flex h-full flex-col items-center justify-center">
            <Navigation className="size-5 text-primary/70" />
            <span className="my-2 h-16 w-px bg-border" />
            <Flag className="size-5 text-primary/70" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
          <div className="flex items-center gap-3">
            <Flag className="size-5 text-primary" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Destination
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold">{formatOptionalText(position.destination.displayLabel)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Code postal: {formatOptionalText(position.destination.postalCode)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-card px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          État actuel
        </p>
        <p className="mt-1 text-base font-semibold">{formatOptionalText(position.status.label)}</p>
      </div>
    </div>
  );
}
