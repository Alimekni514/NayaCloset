import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ORDER_STATUS_LABEL } from '@/features/shared/types';
import { cn } from '@/lib/utils';
const STYLES = {
    PENDING: 'bg-warning/15 text-warning-foreground ring-warning/30',
    APPROVING: 'bg-info/12 text-info ring-info/30',
    APPROVED: 'bg-success/15 text-success ring-success/30',
    ABM_CREATED: 'bg-primary/12 text-primary ring-primary/25',
    ABM_FAILED: 'bg-destructive/15 text-destructive ring-destructive/40',
    VALIDATED: 'bg-success/15 text-success ring-success/30',
    REJECTED: 'bg-destructive/12 text-destructive ring-destructive/30',
    ABM_PROCESSING: 'bg-info/12 text-info ring-info/30',
    SHIPMENT_CREATED: 'bg-primary/12 text-primary ring-primary/25',
    ABM_ERROR: 'bg-destructive/15 text-destructive ring-destructive/40',
    CANCELLED: 'bg-muted text-muted-foreground ring-border',
};
export function OrderStatusBadge({ status, className }) {
    return (_jsxs("span", { className: cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', STYLES[status], className), children: [_jsx("span", { className: "size-1.5 rounded-full bg-current", "aria-hidden": true }), ORDER_STATUS_LABEL[status]] }));
}
