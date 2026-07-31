import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Skeleton } from '@/components/ui/skeleton';
export function PositionDetailSkeleton() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "surface-card space-y-4 p-6", children: [_jsx(Skeleton, { className: "h-4 w-32" }), _jsx(Skeleton, { className: "h-10 w-64" }), _jsx(Skeleton, { className: "h-5 w-full max-w-2xl" })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: Array.from({ length: 4 }).map((_, index) => (_jsx(Skeleton, { className: "h-28 rounded-3xl" }, index))) }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.55fr)]", children: [_jsx(Skeleton, { className: "min-h-[520px] rounded-3xl" }), _jsx("div", { className: "space-y-6", children: Array.from({ length: 6 }).map((_, index) => (_jsx(Skeleton, { className: "h-48 rounded-3xl" }, index))) })] })] }));
}
