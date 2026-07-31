import { Fragment } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Copy,
  Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatTND } from '@/lib/format';

import type { AbmPositionListItem } from '@delivery-commerce/shared';

import { formatShortDate, formatShortTime } from '../lib/position-formatters';
import type { PositionSort, PositionSortKey } from '../types/abm-position-list.types';
import { PositionActionsMenu } from './PositionActionsMenu';
import { PositionExpandedDetails } from './PositionExpandedDetails';
import { PositionStatusBadge } from './PositionStatusBadge';

interface Props {
  positions: AbmPositionListItem[];
  sort: PositionSort;
  onSortChange: (key: PositionSortKey) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onCopy: (value: string) => void;
  onView: (p: AbmPositionListItem) => void;
  onEdit: (p: AbmPositionListItem) => void;
  onDelete: (p: AbmPositionListItem) => void;
}

const COLUMNS: { key: string; label: string; sortKey?: PositionSortKey; className?: string }[] = [
  { key: 'expand', label: '' },
  { key: 'position', label: 'Position', sortKey: 'barcode' },
  { key: 'reference', label: 'Référence', sortKey: 'reference' },
  { key: 'createdAt', label: 'Créée le', sortKey: 'createdAt' },
  { key: 'pickup', label: 'Enlèvement', sortKey: 'pickupDate' },
  { key: 'delivery', label: 'Livraison', sortKey: 'deliveryDate' },
  { key: 'departure', label: 'Départ' },
  { key: 'recipient', label: 'Destinataire', sortKey: 'recipient' },
  { key: 'destination', label: 'Destination', sortKey: 'governorate' },
  { key: 'service', label: 'Service' },
  { key: 'cod', label: 'COD', sortKey: 'codAmount', className: 'text-right' },
  { key: 'status', label: 'Statut', sortKey: 'status' },
  { key: 'attempts', label: 'Tentatives' },
  { key: 'pieces', label: 'Pièces' },
  { key: 'actions', label: 'Actions', className: 'text-right' },
];

export function PositionsTable({
  positions,
  sort,
  onSortChange,
  expandedId,
  onToggleExpand,
  onCopy,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="surface-card hidden overflow-x-auto md:block">
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => {
              const active = column.sortKey && sort.key === column.sortKey;
              const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
              return (
                <TableHead
                  key={column.key}
                  className={cn('whitespace-nowrap text-xs', column.className)}
                  aria-sort={
                    active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.sortKey!)}
                      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {column.label}
                      <Icon
                        className={cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground')}
                      />
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((p) => {
            const expanded = expandedId === p.id;
            return (
              <Fragment key={p.id}>
                <TableRow className={cn(expanded && 'bg-secondary/40')}>
                  <TableCell className="w-10 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Réduire les détails' : 'Afficher les détails'}
                      onClick={() => onToggleExpand(p.id)}
                    >
                      {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold tabular-nums">{p.barcode}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Copier l'identifiant ${p.barcode}`}
                            onClick={() => onCopy(p.barcode)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copier l&apos;identifiant</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-sm">{p.reference}</TableCell>

                  <TableCell className="py-3 text-sm">
                    <div>{formatShortDate(p.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">{formatShortTime(p.createdAt)}</div>
                  </TableCell>

                  <TableCell className="py-3 text-sm">
                    {p.pickupDate ? (
                      <>
                        <div>{formatShortDate(p.pickupDate)}</div>
                        <div className="text-xs text-muted-foreground">{formatShortTime(p.pickupDate)}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Non planifié</span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-sm">
                    {p.deliveryDate ? (
                      <>
                        <div>{formatShortDate(p.deliveryDate)}</div>
                        <div className="text-xs text-muted-foreground">{formatShortTime(p.deliveryDate)}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-sm">
                    <div className="font-medium uppercase">{p.departure.city}</div>
                    <div className="text-xs uppercase text-muted-foreground">{p.departure.locality}</div>
                  </TableCell>

                  <TableCell className="py-3 text-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="min-w-0">
                          <div className="font-medium">
                            {p.recipient.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.recipient.phone}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{p.recipient.email ?? 'Email non renseigné'}</TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className="py-3 text-sm">
                    <div className="font-medium">{p.destination.governorate}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.destination.city} · {p.destination.locality}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.destination.postalCode}</div>
                  </TableCell>

                  <TableCell className="py-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {p.service}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap py-3 text-right text-sm font-semibold tabular-nums">
                    {formatTND(p.codAmount)}
                  </TableCell>

                  <TableCell className="py-3">
                    <PositionStatusBadge statusCategory={p.statusCategory} statusLabel={p.statusLabel} />
                  </TableCell>

                  <TableCell className="py-3">
                    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium tabular-nums">
                      {p.deliveryAttempts}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      <Package className="size-3.5" aria-hidden />
                      {p.pieces}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <PositionActionsMenu
                      position={p}
                      onView={() => onView(p)}
                      onEdit={() => onEdit(p)}
                      onCopy={() => onCopy(p.barcode)}
                      onDelete={() => onDelete(p)}
                    />
                  </TableCell>
                </TableRow>

                {expanded ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNS.length} className="bg-secondary/20 p-3">
                      <PositionExpandedDetails
                        position={p}
                        onView={() => onView(p)}
                        onEdit={() => onEdit(p)}
                        onDelete={() => onDelete(p)}
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
