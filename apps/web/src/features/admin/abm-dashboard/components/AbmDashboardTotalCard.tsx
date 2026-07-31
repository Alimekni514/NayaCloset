import type { LucideIcon } from 'lucide-react';

export const AbmDashboardTotalCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) => (
  <div className="rounded-3xl border border-primary/20 bg-primary px-6 py-5 text-primary-foreground shadow-soft">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
          {label}
        </p>
        <p className="mt-3 font-display text-4xl font-semibold tracking-tight">{value}</p>
      </div>
      <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
        <Icon className="size-7" />
      </span>
    </div>
  </div>
);
