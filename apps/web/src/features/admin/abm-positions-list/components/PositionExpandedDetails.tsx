import { Eye, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatTND } from '@/lib/format';

import type { AbmPositionListItem } from '@delivery-commerce/shared';

import { formatShortDate, formatShortTime } from '../lib/position-formatters';
import { PositionStatusBadge } from './PositionStatusBadge';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <dl className="mt-3 space-y-3">{children}</dl>
    </div>
  );
}

export function PositionExpandedDetails({
  position,
  onView,
  onEdit,
  onDelete,
}: {
  position: AbmPositionListItem;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { canEdit, canDelete } = position.permissions;
  const address = [position.destination.addressLine1, position.destination.addressLine2]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="rounded-2xl bg-secondary/50 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Section title="Contact">
          <Field label="Nom complet" value={position.recipient.fullName} />
          <Field label="Téléphone" value={position.recipient.phone} />
          <Field label="Email" value={position.recipient.email ?? '—'} />
        </Section>

        <Section title="Livraison">
          <Field label="Gouvernorat" value={position.destination.governorate} />
          <Field label="Ville" value={position.destination.city} />
          <Field label="Cité" value={position.destination.locality} />
          <Field label="Code postal" value={position.destination.postalCode} />
          <Field label="Adresse complète" value={address || '—'} />
        </Section>

        <Section title="Expédition">
          <Field label="Service" value={position.service} />
          <Field label="COD" value={formatTND(position.codAmount)} />
          <Field label="Nombre de pièces" value={String(position.pieces)} />
          <Field label="Tentatives" value={String(position.deliveryAttempts)} />
        </Section>

        <Section title="Suivi">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statut actuel</dt>
            <dd className="mt-1">
              <PositionStatusBadge
                statusCategory={position.statusCategory}
                statusLabel={position.statusLabel}
              />
            </dd>
          </div>
          <Field
            label="Dernière mise à jour"
            value={
              position.updatedAt
                ? `${formatShortDate(position.updatedAt)} · ${formatShortTime(position.updatedAt)}`
                : '—'
            }
          />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Suivi</dt>
            <dd className="mt-2 flex items-center gap-1.5" aria-hidden>
              <span className="size-2 rounded-full bg-primary" />
              <span className="h-0.5 flex-1 bg-primary/30" />
              <span className="size-2 rounded-full bg-primary/40" />
              <span className="h-0.5 flex-1 bg-border" />
              <span className="size-2 rounded-full bg-border" />
            </dd>
            <p className="mt-2 text-xs text-muted-foreground">
              Historique détaillé disponible dans la fiche position.
            </p>
          </div>
        </Section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="size-4" />
          Voir le détail complet
        </Button>
        <Button variant="outline" size="sm" disabled={!canEdit} onClick={onEdit}>
          <Pencil className="size-4" />
          Modifier
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canDelete}
          onClick={onDelete}
          className="text-destructive"
        >
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
