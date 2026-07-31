import { Info } from 'lucide-react';

export const AbmDashboardInfoBanner = ({
  from,
  to,
  filtered,
}: {
  from: string | null;
  to: string | null;
  filtered: boolean;
}) => (
  <div className="rounded-3xl border border-primary/15 bg-primary/5 px-5 py-4 shadow-soft">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
        <Info className="size-5" />
      </span>
      <p className="text-sm text-foreground">
        {filtered && from && to
          ? `Les donnees affichees sont filtrees du ${from} au ${to}, sauf les indicateurs marques "Non filtre par periode".`
          : "Les donnees affichees couvrent l'ensemble des donnees disponibles."}
      </p>
    </div>
  </div>
);
