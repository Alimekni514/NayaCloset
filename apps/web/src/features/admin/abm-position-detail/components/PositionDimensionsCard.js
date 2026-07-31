import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from 'lucide-react';
import { formatMetric } from '../lib/position-detail-formatters';
export function PositionDimensionsCard({ position }) {
    const items = [
        ['Longueur', formatMetric(position.dimensions.lengthCm, 'cm')],
        ['Largeur', formatMetric(position.dimensions.widthCm, 'cm')],
        ['Hauteur', formatMetric(position.dimensions.heightCm, 'cm')],
        ['Volume', formatMetric(position.dimensions.volume, 'cm³')],
    ];
    return (_jsxs("div", { className: "surface-card rounded-3xl p-6", children: [_jsxs("div", { className: "mb-5 flex items-center gap-3", children: [_jsx("span", { className: "grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary", children: _jsx(Box, { className: "size-5" }) }), _jsx("div", { children: _jsx("h2", { className: "font-display text-2xl font-semibold", children: "Dimensions" }) })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: items.map(([label, value]) => (_jsxs("div", { className: "rounded-2xl border border-border/70 bg-secondary/40 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground", children: label }), _jsx("p", { className: "mt-3 text-lg font-semibold", children: value })] }, label))) })] }));
}
