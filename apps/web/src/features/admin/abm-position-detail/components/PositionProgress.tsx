import { CircleCheckBig, PackageCheck, Truck } from 'lucide-react';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

const stages = [
  { key: 'pickup', label: 'Enlèvement', icon: PackageCheck },
  { key: 'delivery', label: 'Livraison', icon: Truck },
  { key: 'delivered', label: 'Livré', icon: CircleCheckBig },
] as const;

export function PositionProgress({ position }: { position: AbmPositionDetail }) {
  const currentIndex = stages.findIndex((stage) => stage.key === position.progressStage);

  return (
    <div className="surface-card rounded-3xl p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">Progression de l&apos;expédition</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lecture simplifiée de l&apos;état réel remonté par ABM.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stages.map((stage, index) => {
          const state =
            index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'future';

          return (
            <div
              key={stage.key}
              className={
                state === 'completed'
                  ? 'rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900'
                  : state === 'current'
                    ? 'rounded-3xl border border-primary/30 bg-primary/10 p-4 text-primary'
                    : 'rounded-3xl border border-border bg-secondary/40 p-4 text-muted-foreground'
              }
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-white/80 shadow-soft">
                  <stage.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {state === 'completed' ? 'Terminée' : state === 'current' ? 'En cours' : 'À venir'}
                  </p>
                  <p className="mt-1 text-base font-semibold">{stage.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
