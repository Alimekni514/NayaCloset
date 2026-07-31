import { mapAbmProgressStage, mapAbmStatusCategory, type AbmPositionDetailStatusCategory } from '@delivery-commerce/shared';

export const DETAIL_STATUS_BADGE_STYLES: Record<AbmPositionDetailStatusCategory, string> = {
  created: 'bg-sky-100 text-sky-800 ring-sky-200',
  progress: 'bg-amber-100 text-amber-800 ring-amber-200',
  delivered: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  anomaly: 'bg-rose-100 text-rose-800 ring-rose-200',
  return: 'bg-orange-100 text-orange-800 ring-orange-200',
  cancelled: 'bg-slate-200 text-slate-700 ring-slate-300',
  neutral: 'bg-muted text-muted-foreground ring-border',
};

export { mapAbmProgressStage, mapAbmStatusCategory };
