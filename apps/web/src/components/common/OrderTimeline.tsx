import { Check, CircleAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { OrderEvent } from "@/features/shared/types";

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {events.map((event, index) => {
        const isError = event.status === "ABM_ERROR" || event.status === "REJECTED";
        const isLast = index === events.length - 1;
        return (
          <li key={`${event.status}-${event.at}`} className="relative">
            <span
              className={cn(
                "absolute -left-[35px] grid size-6 place-items-center rounded-full ring-4 ring-background",
                isError
                  ? "bg-destructive text-destructive-foreground"
                  : isLast
                    ? "bg-primary text-primary-foreground"
                    : "bg-success text-success-foreground",
              )}
            >
              {isError ? (
                <CircleAlert className="size-3.5" />
              ) : isLast ? (
                <Clock className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
            <p className="text-sm font-semibold text-foreground">{event.label}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
            {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}