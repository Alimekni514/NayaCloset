import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, Copy, Package, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger, } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatTND } from '@/lib/format';
import { formatShortDate, formatShortTime } from '../lib/position-formatters';
import { PositionActionsMenu } from './PositionActionsMenu';
import { PositionExpandedDetails } from './PositionExpandedDetails';
import { PositionStatusBadge } from './PositionStatusBadge';
const COLUMNS = [
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
export function PositionsTable({ positions, sort, onSortChange, expandedId, onToggleExpand, onCopy, onView, onEdit, onDelete, }) {
    return (_jsx("div", { className: "surface-card hidden overflow-x-auto md:block", children: _jsxs(Table, { className: "min-w-[1180px]", children: [_jsx(TableHeader, { children: _jsx(TableRow, { className: "hover:bg-transparent", children: COLUMNS.map((column) => {
                            const active = column.sortKey && sort.key === column.sortKey;
                            const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                            return (_jsx(TableHead, { className: cn('whitespace-nowrap text-xs', column.className), "aria-sort": active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined, children: column.sortKey ? (_jsxs("button", { type: "button", onClick: () => onSortChange(column.sortKey), className: "inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", children: [column.label, _jsx(Icon, { className: cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground') })] })) : (_jsx("span", { children: column.label })) }, column.key));
                        }) }) }), _jsx(TableBody, { children: positions.map((p) => {
                        const expanded = expandedId === p.id;
                        return (_jsxs(Fragment, { children: [_jsxs(TableRow, { className: cn(expanded && 'bg-secondary/40'), children: [_jsx(TableCell, { className: "w-10 py-3", children: _jsx(Button, { variant: "ghost", size: "icon", className: "size-8", "aria-expanded": expanded, "aria-label": expanded ? 'Réduire les détails' : 'Afficher les détails', onClick: () => onToggleExpand(p.id), children: expanded ? _jsx(ChevronDown, { className: "size-4" }) : _jsx(ChevronRight, { className: "size-4" }) }) }), _jsx(TableCell, { className: "py-3", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "font-semibold tabular-nums", children: p.barcode }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "size-7", "aria-label": `Copier l'identifiant ${p.barcode}`, onClick: () => onCopy(p.barcode), children: _jsx(Copy, { className: "size-3.5" }) }) }), _jsx(TooltipContent, { children: "Copier l'identifiant" })] })] }) }), _jsx(TableCell, { className: "py-3 text-sm", children: p.reference }), _jsxs(TableCell, { className: "py-3 text-sm", children: [_jsx("div", { children: formatShortDate(p.createdAt) }), _jsx("div", { className: "text-xs text-muted-foreground", children: formatShortTime(p.createdAt) })] }), _jsx(TableCell, { className: "py-3 text-sm", children: p.pickupDate ? (_jsxs(_Fragment, { children: [_jsx("div", { children: formatShortDate(p.pickupDate) }), _jsx("div", { className: "text-xs text-muted-foreground", children: formatShortTime(p.pickupDate) })] })) : (_jsx("span", { className: "text-muted-foreground", children: "Non planifi\u00E9" })) }), _jsx(TableCell, { className: "py-3 text-sm", children: p.deliveryDate ? (_jsxs(_Fragment, { children: [_jsx("div", { children: formatShortDate(p.deliveryDate) }), _jsx("div", { className: "text-xs text-muted-foreground", children: formatShortTime(p.deliveryDate) })] })) : (_jsx("span", { className: "text-muted-foreground", children: "\u2014" })) }), _jsxs(TableCell, { className: "py-3 text-sm", children: [_jsx("div", { className: "font-medium uppercase", children: p.departure.city }), _jsx("div", { className: "text-xs uppercase text-muted-foreground", children: p.departure.locality })] }), _jsx(TableCell, { className: "py-3 text-sm", children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-medium", children: p.recipient.fullName }), _jsx("div", { className: "text-xs text-muted-foreground", children: p.recipient.phone })] }) }), _jsx(TooltipContent, { children: p.recipient.email ?? 'Email non renseigné' })] }) }), _jsxs(TableCell, { className: "py-3 text-sm", children: [_jsx("div", { className: "font-medium", children: p.destination.governorate }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [p.destination.city, " \u00B7 ", p.destination.locality] }), _jsx("div", { className: "text-xs text-muted-foreground", children: p.destination.postalCode })] }), _jsx(TableCell, { className: "py-3", children: _jsx("span", { className: "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary", children: p.service }) }), _jsx(TableCell, { className: "whitespace-nowrap py-3 text-right text-sm font-semibold tabular-nums", children: formatTND(p.codAmount) }), _jsx(TableCell, { className: "py-3", children: _jsx(PositionStatusBadge, { statusCategory: p.statusCategory, statusLabel: p.statusLabel }) }), _jsx(TableCell, { className: "py-3", children: _jsx("span", { className: "inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium tabular-nums", children: p.deliveryAttempts }) }), _jsx(TableCell, { className: "py-3", children: _jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium", children: [_jsx(Package, { className: "size-3.5", "aria-hidden": true }), p.pieces] }) }), _jsx(TableCell, { className: "py-3 text-right", children: _jsx(PositionActionsMenu, { position: p, onView: () => onView(p), onEdit: () => onEdit(p), onCopy: () => onCopy(p.barcode), onDelete: () => onDelete(p) }) })] }), expanded ? (_jsx(TableRow, { className: "hover:bg-transparent", children: _jsx(TableCell, { colSpan: COLUMNS.length, className: "bg-secondary/20 p-3", children: _jsx(PositionExpandedDetails, { position: p, onView: () => onView(p), onEdit: () => onEdit(p), onDelete: () => onDelete(p) }) }) })) : null] }, p.id));
                    }) })] }) }));
}
