import { ChevronDown, ChevronRight, MapPin, Package, Phone } from 'lucide-react';

import { formatTND } from '@/lib/format';
import { cn } from '@/lib/utils';

import type { AbmPositionListItem } from '@delivery-commerce/shared';

import { formatShortDate, formatShortTime } from '../lib/position-formatters';
import { PositionActionsMenu } from './PositionActionsMenu';
import { PositionExpandedDetails } from './PositionExpandedDetails';
import { PositionStatusBadge } from './PositionStatusBadge';

interface Props {
  position: AbmPositionListItem;
  expanded: boolean;
  onToggle: () => void;
  onCopy: (value: string) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PositionMobileCard({
  position: p,
  expanded,
  onToggle,
  onCopy,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <article className={cn('surface-card p-4', expanded && 'ring-1 ring-primary/20')}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="min-w-0 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-semibold tabular-nums">{p.barcode}</span>
          </div>
          <p className="mt-0.5 truncate pl-5 text-xs text-muted-foreground">{p.reference}</p>
        </button>
        <PositionActionsMenu
          position={p}
          onView={onView}
          onEdit={onEdit}
          onCopy={() => onCopy(p.barcode)}
          onDelete={onDelete}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PositionStatusBadge statusCategory={p.statusCategory} statusLabel={p.statusLabel} />
        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {p.service}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          <Package className="size-3.5" aria-hidden />
          {p.pieces}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 truncate">
            {p.recipient.fullName} · {p.recipient.phone}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 truncate">
            {p.destination.governorate} · {p.destination.city}
          </span>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {formatShortDate(p.createdAt)} · {formatShortTime(p.createdAt)}
        </span>
        <span className="text-sm font-semibold tabular-nums">{formatTND(p.codAmount)}</span>
      </div>

      {expanded ? (
        <div className="mt-3">
          <PositionExpandedDetails position={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ) : null}
    </article>
  );
}
