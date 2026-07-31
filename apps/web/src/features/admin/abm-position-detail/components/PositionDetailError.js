import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
export function PositionDetailError({ message, backSearch, onRetry, }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx(Button, { asChild: true, variant: "ghost", className: "-ml-2", children: _jsxs(Link, { to: "/admin/positions", ...(backSearch ? { search: backSearch } : {}), children: [_jsx(ArrowLeft, { className: "size-4" }), "Retour aux positions"] }) }), onRetry ? (_jsxs(Button, { variant: "outline", onClick: onRetry, children: [_jsx(RefreshCw, { className: "size-4" }), "R\u00E9essayer"] })) : null] }), _jsx(ErrorState, { message: message, ...(onRetry ? { onRetry } : {}) })] }));
}
