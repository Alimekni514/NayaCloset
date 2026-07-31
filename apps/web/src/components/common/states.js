import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function EmptyState({ title, description, icon: Icon = PackageOpen, action, }) {
    return (_jsxs("div", { className: "surface-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", children: [_jsx("span", { className: "grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground", children: _jsx(Icon, { className: "size-6" }) }), _jsx("h3", { className: "text-lg font-semibold", children: title }), description ? _jsx("p", { className: "max-w-sm text-sm text-muted-foreground", children: description }) : null, action] }));
}
export function ErrorState({ message, onRetry }) {
    return (_jsxs("div", { className: "surface-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", children: [_jsx("span", { className: "grid size-14 place-items-center rounded-2xl bg-destructive/12 text-destructive", children: _jsx(AlertTriangle, { className: "size-6" }) }), _jsx("h3", { className: "text-lg font-semibold", children: "Une erreur est survenue" }), _jsx("p", { className: "max-w-sm text-sm text-muted-foreground", children: message ?? "Impossible de charger les données pour le moment." }), onRetry ? (_jsx(Button, { variant: "outline", onClick: onRetry, children: "R\u00E9essayer" })) : null] }));
}
export function LoadingSkeleton({ variant = "list", count = 6, }) {
    if (variant === "grid") {
        return (_jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: Array.from({ length: count }).map((_, i) => (_jsxs("div", { className: "surface-card overflow-hidden", children: [_jsx(Skeleton, { className: "aspect-square w-full rounded-none" }), _jsxs("div", { className: "space-y-2 p-4", children: [_jsx(Skeleton, { className: "h-4 w-3/4" }), _jsx(Skeleton, { className: "h-4 w-1/3" })] })] }, i))) }));
    }
    if (variant === "table") {
        return (_jsx("div", { className: "surface-card divide-y divide-border", children: Array.from({ length: count }).map((_, i) => (_jsxs("div", { className: "flex items-center gap-4 p-4", children: [_jsx(Skeleton, { className: "h-4 w-28" }), _jsx(Skeleton, { className: "h-4 flex-1" }), _jsx(Skeleton, { className: "h-6 w-24 rounded-full" })] }, i))) }));
    }
    if (variant === "card") {
        return (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: Array.from({ length: count }).map((_, i) => (_jsx(Skeleton, { className: "h-28 rounded-3xl" }, i))) }));
    }
    return (_jsx("div", { className: "space-y-3", children: Array.from({ length: count }).map((_, i) => (_jsx(Skeleton, { className: "h-16 w-full rounded-2xl" }, i))) }));
}
