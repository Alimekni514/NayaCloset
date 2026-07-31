import { cn } from '@/lib/utils';

import { getStatusLabel, STATUS_BADGE_STYLES } from '../types/abm-position-list.types';

interface Props {
  statusCategory: string;
  statusLabel?: string;
  className?: string;
}

export function PositionStatusBadge({ statusCategory, statusLabel, className }: Props) {
  const style = STATUS_BADGE_STYLES[statusCategory] ?? 'bg-muted text-muted-foreground ring-border';
  const label = statusLabel ?? getStatusLabel(statusCategory);

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        style,
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
