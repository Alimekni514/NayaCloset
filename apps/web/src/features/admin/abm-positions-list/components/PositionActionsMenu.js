import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
export function PositionActionsMenu({ position, onView, onEdit, onCopy, onDelete }) {
    const { canEdit, canDelete } = position.permissions;
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", "aria-label": `Actions pour la position ${position.barcode}`, onClick: (e) => e.stopPropagation(), children: _jsx(MoreHorizontal, { className: "size-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-52", onClick: (e) => e.stopPropagation(), children: [_jsxs(DropdownMenuItem, { onSelect: onView, children: [_jsx(Eye, { className: "size-4" }), "Voir les d\u00E9tails"] }), _jsxs(DropdownMenuItem, { disabled: !canEdit, onSelect: onEdit, children: [_jsx(Pencil, { className: "size-4" }), "Modifier"] }), _jsxs(DropdownMenuItem, { onSelect: onCopy, children: [_jsx(Copy, { className: "size-4" }), "Copier l'identifiant"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { disabled: !canDelete, onSelect: onDelete, className: "text-destructive focus:text-destructive", children: [_jsx(Trash2, { className: "size-4" }), "Supprimer"] })] })] }));
}
