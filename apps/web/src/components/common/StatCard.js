import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
const TONES = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    danger: "bg-destructive/12 text-destructive",
};
export function StatCard({ label, value, icon: Icon, hint, tone = "default", loading }) {
    return (_jsx("div", { className: "surface-card p-5", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-medium text-muted-foreground", children: label }), loading ? (_jsx(Skeleton, { className: "mt-3 h-8 w-24" })) : (_jsx("p", { className: "mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl", children: value })), hint ? _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: hint }) : null] }), _jsx("span", { className: cn("grid size-11 shrink-0 place-items-center rounded-2xl", TONES[tone]), children: _jsx(Icon, { className: "size-5" }) })] }) }));
}
