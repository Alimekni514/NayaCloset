import type { AbmPositionDetail } from '@delivery-commerce/shared';

import { formatCod, formatMetric, formatOptionalText } from '../lib/position-detail-formatters';

export function PositionShipmentCard({ position }: { position: AbmPositionDetail }) {
  const shipment = position.shipment;

  const rows = [
    ['Type', formatOptionalText(shipment.type)],
    ['Service', formatOptionalText(shipment.service)],
    ['Poids', formatMetric(shipment.weightKg, 'kg')],
    ['Nombre de pièces', shipment.pieces == null ? 'Non disponible' : String(shipment.pieces)],
    ['Référence', formatOptionalText(shipment.reference ?? position.reference)],
    ['Valeur déclarée', shipment.declaredValue == null ? 'Non disponible' : formatCod(shipment.declaredValue)],
    ['Contenu', shipment.contents?.length ? shipment.contents.join(', ') : 'Non disponible'],
    ['Montant COD', formatCod(shipment.codAmount)],
    ['Mode de paiement', formatOptionalText(shipment.paymentMode)],
    ['Échange', shipment.exchange == null ? 'Non disponible' : shipment.exchange ? 'Oui' : 'Non'],
    ['Ouverture autorisée', shipment.allowOpen == null ? 'Non disponible' : shipment.allowOpen ? 'Oui' : 'Non'],
  ];

  return (
    <div className="surface-card rounded-3xl p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">Informations du colis</h2>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-3 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
