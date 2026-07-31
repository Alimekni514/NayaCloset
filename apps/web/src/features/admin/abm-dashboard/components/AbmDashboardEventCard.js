import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
const toneClasses = {
    created: {
        shell: 'border-primary/20 bg-primary/5',
        icon: 'bg-primary/12 text-primary',
    },
    success: {
        shell: 'border-emerald-200 bg-emerald-50',
        icon: 'bg-emerald-100 text-emerald-700',
    },
    danger: {
        shell: 'border-red-200 bg-red-50',
        icon: 'bg-red-100 text-red-700',
    },
    progress: {
        shell: 'border-amber-200 bg-amber-50',
        icon: 'bg-amber-100 text-amber-700',
    },
    info: {
        shell: 'border-cyan-200 bg-cyan-50',
        icon: 'bg-cyan-100 text-cyan-700',
    },
    return: {
        shell: 'border-orange-200 bg-orange-50',
        icon: 'bg-orange-100 text-orange-700',
    },
    neutral: {
        shell: 'border-slate-200 bg-slate-50',
        icon: 'bg-slate-100 text-slate-700',
    },
};
export const AbmDashboardEventCard = ({ count, label, hasDate, filtered, presentation, }) => {
    const Icon = presentation.icon;
    const tone = toneClasses[presentation.tone];
    return (_jsxs("div", { className: cn('rounded-3xl border p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lift', tone.shell), children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("span", { className: cn('grid size-11 place-items-center rounded-2xl', tone.icon), children: _jsx(Icon, { className: "size-5" }) }), _jsx("p", { className: "font-display text-4xl font-semibold tracking-tight", children: count })] }), _jsx("p", { className: "mt-5 text-sm font-semibold text-foreground", children: label }), filtered ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: hasDate ? 'Filtre sur la periode selectionnee' : 'Non filtre par periode' })) : !hasDate ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Indicateur global" })) : null] }));
};
