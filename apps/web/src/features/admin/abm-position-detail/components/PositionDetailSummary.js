import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Activity, Banknote, Package, Truck } from 'lucide-react';
import { formatCod, formatOptionalText } from '../lib/position-detail-formatters';
const summaryItems = (position) => [
    {
        label: 'Statut actuel',
        value: formatOptionalText(position.status.label),
        icon: Activity,
    },
    {
        label: 'Service',
        value: formatOptionalText(position.shipment.service),
        icon: Truck,
    },
    {
        label: 'Montant COD',
        value: formatCod(position.shipment.codAmount),
        icon: Banknote,
    },
    {
        label: 'Nombre de pièces',
        value: position.shipment.pieces == null ? 'Non disponible' : String(position.shipment.pieces),
        icon: Package,
    },
];
export function PositionDetailSummary({ position }) {
    return (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: summaryItems(position).map((item) => (_jsxs("div", { className: "surface-card rounded-3xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { className: "grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary", children: _jsx(item.icon, { className: "size-5" }) }), _jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground", children: item.label })] }), _jsx("p", { className: "mt-4 font-display text-xl font-semibold leading-tight", children: item.value })] }, item.label))) }));
}
