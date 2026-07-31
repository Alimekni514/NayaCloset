import { Copy, Mail, MapPinned, Phone, UserRound } from 'lucide-react';
import type { AbmPositionDetail } from '@delivery-commerce/shared';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { formatOptionalText } from '../lib/position-detail-formatters';

async function copyValue(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copié`, { description: value });
  } catch {
    toast.error(`Impossible de copier ${label.toLowerCase()}.`);
  }
}

export function PositionRecipientCard({ position }: { position: AbmPositionDetail }) {
  const recipient = position.recipient;
  const address =
    position.destination.address ??
    [position.destination.city, position.destination.locality, position.destination.postalCode]
      .filter(Boolean)
      .join(', ');

  return (
    <div className="surface-card rounded-3xl p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">Destinataire</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field icon={UserRound} label="Nom complet" value={formatOptionalText(recipient?.fullName)} />
        <ActionField
          icon={Phone}
          label="Téléphone"
          value={formatOptionalText(recipient?.phone)}
          {...(recipient?.phone
            ? { onCopy: () => void copyValue(recipient.phone!, 'Téléphone') }
            : {})}
        />
        <ActionField
          icon={Mail}
          label="Email"
          value={formatOptionalText(recipient?.email)}
          {...(recipient?.email ? { onCopy: () => void copyValue(recipient.email!, 'Email') } : {})}
        />
        <Field icon={MapPinned} label="Adresse" value={formatOptionalText(address)} />
        <Field label="Gouvernorat" value={formatOptionalText(position.destination.governorate)} />
        <Field label="Ville" value={formatOptionalText(position.destination.city)} />
        <Field label="Localité" value={formatOptionalText(position.destination.locality)} />
        <Field label="Code postal" value={formatOptionalText(position.destination.postalCode)} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {Icon ? <Icon className="size-4" /> : null}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium">{value}</p>
    </div>
  );
}

function ActionField({
  label,
  value,
  onCopy,
  icon: Icon,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  icon: typeof Phone;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Icon className="size-4" />
          <span>{label}</span>
        </div>
        {onCopy ? (
          <Button variant="ghost" size="icon" onClick={onCopy} aria-label={`Copier ${label.toLowerCase()}`}>
            <Copy className="size-4" />
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-sm font-medium">{value}</p>
    </div>
  );
}
