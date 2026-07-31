import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { PositionWizard, usePositionFormOptions } from '@/features/admin/abm-position-create';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { apiErrorUtils } from '@/lib/api-client';
export const Route = createFileRoute('/admin/positions/nouvelle')({
    head: () => ({
        meta: [
            { title: 'Nouvelle position - Dar Souk Admin' },
            {
                name: 'description',
                content: 'Creation d une expedition ABM en quatre etapes.',
            },
        ],
    }),
    component: AdminPositionCreatePage,
});
export function AdminPositionCreatePage() {
    const optionsQuery = usePositionFormOptions();
    if (optionsQuery.isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Nouvelle position" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Creez une expedition ABM en quatre etapes." })] }), _jsx(LoadingSkeleton, { variant: "card", count: 4 })] }));
    }
    if (optionsQuery.isError || !optionsQuery.data) {
        const message = optionsQuery.error && apiErrorUtils.isApiError(optionsQuery.error) && optionsQuery.error.status === 503
            ? "L'integration ABM n'est pas configuree."
            : 'Impossible de charger le formulaire ABM.';
        return _jsx(ErrorState, { message: message, onRetry: () => void optionsQuery.refetch() });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Nouvelle position" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Creez une expedition ABM en quatre etapes." })] }), _jsx(PositionWizard, { options: optionsQuery.data })] }));
}
