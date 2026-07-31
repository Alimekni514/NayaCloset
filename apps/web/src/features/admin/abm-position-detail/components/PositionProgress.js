import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CircleCheckBig, PackageCheck, Truck } from 'lucide-react';
const stages = [
    { key: 'pickup', label: 'Enlèvement', icon: PackageCheck },
    { key: 'delivery', label: 'Livraison', icon: Truck },
    { key: 'delivered', label: 'Livré', icon: CircleCheckBig },
];
export function PositionProgress({ position }) {
    const currentIndex = stages.findIndex((stage) => stage.key === position.progressStage);
    return (_jsxs("div", { className: "surface-card rounded-3xl p-6", children: [_jsxs("div", { className: "mb-5", children: [_jsx("h2", { className: "font-display text-2xl font-semibold", children: "Progression de l'exp\u00E9dition" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Lecture simplifi\u00E9e de l'\u00E9tat r\u00E9el remont\u00E9 par ABM." })] }), _jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: stages.map((stage, index) => {
                    const state = index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'future';
                    return (_jsx("div", { className: state === 'completed'
                            ? 'rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900'
                            : state === 'current'
                                ? 'rounded-3xl border border-primary/30 bg-primary/10 p-4 text-primary'
                                : 'rounded-3xl border border-border bg-secondary/40 p-4 text-muted-foreground', children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "grid size-10 place-items-center rounded-2xl bg-white/80 shadow-soft", children: _jsx(stage.icon, { className: "size-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em]", children: state === 'completed' ? 'Terminée' : state === 'current' ? 'En cours' : 'À venir' }), _jsx("p", { className: "mt-1 text-base font-semibold", children: stage.label })] })] }) }, stage.key));
                }) })] }));
}
