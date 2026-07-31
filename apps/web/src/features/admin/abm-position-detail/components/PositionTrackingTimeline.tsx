import { Activity, CircleDot, PackageCheck, Truck } from 'lucide-react';
import type { AbmPositionDetailEvent } from '@delivery-commerce/shared';

import { formatDetailDate, formatDetailTime } from '../lib/position-detail-formatters';

const getEventIcon = (label: string) => {
  if (/livr/iu.test(label)) return PackageCheck;
  if (/hub|valid|planif|tournee|enlev/iu.test(label)) return Truck;
  return Activity;
};

export function PositionTrackingTimeline({ events }: { events: AbmPositionDetailEvent[] }) {
  return (
    <div className="surface-card rounded-3xl p-6 xl:sticky xl:top-24">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold">Historique de suivi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tous les événements enregistrés par ABM.
        </p>
      </div>

      <ol className="space-y-6">
        {events.map((event, index) => {
          const Icon = getEventIcon(event.label);
          const isLast = index === events.length - 1;

          return (
            <li key={event.id} className="relative flex gap-4">
              <div className="relative flex flex-col items-center">
                <span
                  className={
                    event.isCurrent
                      ? 'grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft'
                      : 'grid size-11 place-items-center rounded-2xl bg-secondary text-muted-foreground'
                  }
                >
                  <Icon className="size-5" />
                </span>
                {!isLast ? <span className="mt-2 h-full w-px bg-border" aria-hidden /> : null}
              </div>

              <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-secondary/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{event.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDetailDate(event.occurredAt)} · {formatDetailTime(event.occurredAt)}
                    </p>
                  </div>
                  {event.isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <CircleDot className="size-3.5" />
                      Événement actuel
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
