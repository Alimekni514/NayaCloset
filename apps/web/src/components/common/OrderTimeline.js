import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check, CircleAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
export function OrderTimeline({ events }) {
    return (_jsx("ol", { className: "relative space-y-6 border-l border-border pl-6", children: events.map((event, index) => {
            const isError = event.status === "ABM_ERROR" || event.status === "REJECTED";
            const isLast = index === events.length - 1;
            return (_jsxs("li", { className: "relative", children: [_jsx("span", { className: cn("absolute -left-[35px] grid size-6 place-items-center rounded-full ring-4 ring-background", isError
                            ? "bg-destructive text-destructive-foreground"
                            : isLast
                                ? "bg-primary text-primary-foreground"
                                : "bg-success text-success-foreground"), children: isError ? (_jsx(CircleAlert, { className: "size-3.5" })) : isLast ? (_jsx(Clock, { className: "size-3.5" })) : (_jsx(Check, { className: "size-3.5" })) }), _jsx("p", { className: "text-sm font-semibold text-foreground", children: event.label }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDateTime(event.at) }), event.note ? _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: event.note }) : null] }, `${event.status}-${event.at}`));
        }) }));
}
