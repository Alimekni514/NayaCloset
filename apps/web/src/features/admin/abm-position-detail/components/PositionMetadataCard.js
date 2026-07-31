import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatDetailDateTime } from '../lib/position-detail-formatters';
async function copyValue(value, label) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copié`, { description: value });
    }
    catch {
        toast.error(`Impossible de copier ${label.toLowerCase()}.`);
    }
}
export function PositionMetadataCard({ position }) {
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
    return (_jsxs("div", { className: "surface-card rounded-3xl p-6", children: [_jsx("div", { className: "mb-5", children: _jsx("h2", { className: "font-display text-2xl font-semibold", children: "Informations techniques" }) }), _jsx("dl", { className: "space-y-3", children: rows.map((row) => (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground", children: row.label }), _jsx("dd", { className: "mt-1 text-sm font-medium", children: row.value })] }), row.copyable ? (_jsx(Button, { variant: "ghost", size: "icon", onClick: () => void copyValue(String(row.value), row.label), "aria-label": `Copier ${row.label}`, children: _jsx(Copy, { className: "size-4" }) })) : null] }, row.label))) })] }));
}
