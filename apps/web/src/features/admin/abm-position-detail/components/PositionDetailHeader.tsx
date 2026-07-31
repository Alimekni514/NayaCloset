import { ArrowLeft, Barcode, Download, Eye, MoreHorizontal, Pencil, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PositionStatusBadge } from '@/features/admin/abm-positions-list';
import { cn } from '@/lib/utils';
import type { PositionLabelAction } from '@/features/admin/abm-position-detail/lib/position-label-download';

const isActionLoading = (current: PositionLabelAction | null, action: PositionLabelAction) => current === action;

export function PositionDetailHeader({
  position,
  backSearch,
  refreshing,
  onRefresh,
  onDelete,
  printLoadingAction,
  onPrint,
}: {
  position: AbmPositionDetail;
  backSearch?: object;
  refreshing: boolean;
  onRefresh: () => void;
  onDelete: () => void;
  printLoadingAction: PositionLabelAction | null;
  onPrint: (action: PositionLabelAction) => void;
}) {
  const printBusy = printLoadingAction !== null;

  return (
    <div className="surface-card space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/admin/positions" {...(backSearch ? { search: backSearch } : {})}>
            <ArrowLeft className="size-4" />
            Retour aux positions
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            Actualiser
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={printBusy}>
                <Printer className="size-4" />
                Imprimer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Impression ABM</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={printBusy || !position.permissions.canPrintNormal}
                onSelect={() => onPrint('preview-normal')}
              >
                <Eye className="size-4" />
                {isActionLoading(printLoadingAction, 'preview-normal')
                  ? "Chargement de l'etiquette normale..."
                  : 'Previsualiser etiquette normale'}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={printBusy || !position.permissions.canPrintNormal}
                onSelect={() => onPrint('pdf-normal')}
              >
                <Download className="size-4" />
                {isActionLoading(printLoadingAction, 'pdf-normal')
                  ? 'Preparation du PDF normal...'
                  : 'Telecharger PDF normal'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={printBusy || !position.permissions.canPrintZebra}
                onSelect={() => onPrint('preview-zebra')}
              >
                <Barcode className="size-4" />
                {isActionLoading(printLoadingAction, 'preview-zebra')
                  ? "Chargement de l'etiquette Zebra..."
                  : 'Previsualiser etiquette Zebra'}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={printBusy || !position.permissions.canPrintZebra}
                onSelect={() => onPrint('pdf-zebra')}
              >
                <Download className="size-4" />
                {isActionLoading(printLoadingAction, 'pdf-zebra')
                  ? 'Preparation du PDF Zebra...'
                  : 'Telecharger PDF Zebra'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" disabled>
            <Pencil className="size-4" />
            Modifier - Bientot
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Plus d'actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                disabled={!position.permissions.canDelete}
                onSelect={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Detail de la position
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Position {position.barcode}
          </h1>
          <PositionStatusBadge
            statusCategory={position.status.category}
            statusLabel={position.status.label}
            className="text-sm"
          />
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Consultez les informations, le statut et l&apos;historique complet de cette expedition.
        </p>
      </div>
    </div>
  );
}
