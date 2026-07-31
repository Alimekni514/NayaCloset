import { Activity, Banknote, Package, Truck } from 'lucide-react';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

import { formatCod, formatOptionalText } from '../lib/position-detail-formatters';

const summaryItems = (position: AbmPositionDetail) => [
  {
    label: 'Statut actuel',
    value: formatOptionalText(position.status.label),
    icon: Activity,
  },
  {
    label: 'Service',
    value: formatOptionalText(position.shipment.service),
    icon: Truck,
  },
  {
    label: 'Montant COD',
    value: formatCod(position.shipment.codAmount),
    icon: Banknote,
  },
  {
    label: 'Nombre de pièces',
    value:
      position.shipment.pieces == null ? 'Non disponible' : String(position.shipment.pieces),
    icon: Package,
  },
];

export function PositionDetailSummary({ position }: { position: AbmPositionDetail }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems(position).map((item) => (
        <div key={item.label} className="surface-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </p>
          </div>
          <p className="mt-4 font-display text-xl font-semibold leading-tight">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
