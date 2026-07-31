import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Activity, CircleDot, PackageCheck, Truck } from 'lucide-react';
import { formatDetailDate, formatDetailTime } from '../lib/position-detail-formatters';
const getEventIcon = (label) => {
    if (/livr/iu.test(label))
        return PackageCheck;
    if (/hub|valid|planif|tournee|enlev/iu.test(label))
        return Truck;
    return Activity;
};
export function PositionTrackingTimeline({ events }) {
    return (_jsxs("div", { className: "surface-card rounded-3xl p-6 xl:sticky xl:top-24", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "font-display text-2xl font-semibold", children: "Historique de suivi" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Tous les \u00E9v\u00E9nements enregistr\u00E9s par ABM." })] }), _jsx("ol", { className: "space-y-6", children: events.map((event, index) => {
                    const Icon = getEventIcon(event.label);
                    const isLast = index === events.length - 1;
                    return (_jsxs("li", { className: "relative flex gap-4", children: [_jsxs("div", { className: "relative flex flex-col items-center", children: [_jsx("span", { className: event.isCurrent
                                            ? 'grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft'
                                            : 'grid size-11 place-items-center rounded-2xl bg-secondary text-muted-foreground', children: _jsx(Icon, { className: "size-5" }) }), !isLast ? _jsx("span", { className: "mt-2 h-full w-px bg-border", "aria-hidden": true }) : null] }), _jsx("div", { className: "min-w-0 flex-1 rounded-2xl border border-border/70 bg-secondary/40 p-4", children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: event.label }), _jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [formatDetailDate(event.occurredAt), " \u00B7 ", formatDetailTime(event.occurredAt)] })] }), event.isCurrent ? (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary", children: [_jsx(CircleDot, { className: "size-3.5" }), "\u00C9v\u00E9nement actuel"] })) : null] }) })] }, event.id));
                }) })] }));
}
