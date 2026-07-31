import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { AbmPositionListItem } from '@delivery-commerce/shared';

interface Props {
  position: AbmPositionListItem;
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function PositionActionsMenu({ position, onView, onEdit, onCopy, onDelete }: Props) {
  const { canEdit, canDelete } = position.permissions;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour la position ${position.barcode}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onView}>
          <Eye className="size-4" />
          Voir les détails
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canEdit} onSelect={onEdit}>
          <Pencil className="size-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCopy}>
          <Copy className="size-4" />
          Copier l&apos;identifiant
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!canDelete}
          onSelect={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
