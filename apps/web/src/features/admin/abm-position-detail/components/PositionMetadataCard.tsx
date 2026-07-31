import { Copy } from 'lucide-react';
import type { AbmPositionDetail } from '@delivery-commerce/shared';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { formatDetailDateTime } from '../lib/position-detail-formatters';

async function copyValue(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copié`, { description: value });
  } catch {
    toast.error(`Impossible de copier ${label.toLowerCase()}.`);
  }
}

export function PositionMetadataCard({ position }: { position: AbmPositionDetail }) {
  const rows = [
    { label: 'POSID', value: position.id, copyable: true },
    { label: 'Barcode', value: position.barcode, copyable: true },
    { label: 'Date de création', value: formatDetailDateTime(position.createdAt) },
    { label: 'Date d’enlèvement', value: formatDetailDateTime(position.pickupDate) },
    { label: 'Date de livraison', value: formatDetailDateTime(position.deliveryDate) },
    { label: 'Dernière mise à jour', value: formatDetailDateTime(position.updatedAt) },
    {
      label: 'Nombre de tentatives',
      value: position.attempts == null ? 'Non disponible' : String(position.attempts),
    },
  ];

  return (
    <div className="surface-card rounded-3xl p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">Informations techniques</h2>
      </div>

      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3"
          >
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium">{row.value}</dd>
            </div>
            {row.copyable ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void copyValue(String(row.value), row.label)}
                aria-label={`Copier ${row.label}`}
              >
                <Copy className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
