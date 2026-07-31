/**
 * Re-exports from the shared contract plus frontend-only types.
 * Do not duplicate backend contracts — import from @delivery-commerce/shared.
 */
export type {
  AbmPositionListItem,
  AbmPositionSortBy,
  AbmPositionSortDirection,
  AbmPositionStatusCategory,
  AbmPositionsQuery,
  AbmPositionsResponse,
} from '@delivery-commerce/shared';

export {
  abmPositionSortByValues,
  abmPositionSortDirectionValues,
  abmPositionPageSizeValues,
} from '@delivery-commerce/shared';

// ─── Frontend-only types ──────────────────────────────────────────────────────

export const ABM_POSITION_STATUS_LABELS: Record<string, string> = {
  created: 'Créée',
  progress: 'En cours',
  delivered: 'Livrée',
  anomaly: 'Anomalie',
  return: 'Retour',
  cancelled: 'Annulée',
  neutral: 'Neutre',
};

/** Human-readable status label keyed by the backend statusCategory. */
export function getStatusLabel(category: string): string {
  return ABM_POSITION_STATUS_LABELS[category] ?? category;
}

/** Status badge style keyed by the backend statusCategory. */
export const STATUS_BADGE_STYLES: Record<string, string> = {
  created: 'bg-warning/15 text-warning-foreground ring-warning/30',
  progress: 'bg-info/12 text-info ring-info/30',
  delivered: 'bg-success/15 text-success ring-success/30',
  anomaly: 'bg-destructive/12 text-destructive ring-destructive/30',
  return: 'bg-warning/20 text-warning-foreground ring-warning/40',
  cancelled: 'bg-muted text-muted-foreground ring-border',
  neutral: 'bg-secondary text-secondary-foreground ring-border',
};

export const ABM_GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Kef',
  'Siliana',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Gabès',
  'Médenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kébili',
] as const;

export const ABM_SERVICES = ['ONP', 'BLK', 'FIX'] as const;

/** Sort key type for the positions table – mirrors the shared abmPositionSortByValues */
export type PositionSortKey =
  | 'barcode'
  | 'reference'
  | 'createdAt'
  | 'pickupDate'
  | 'deliveryDate'
  | 'recipient'
  | 'governorate'
  | 'codAmount'
  | 'status';

export interface PositionSort {
  key: PositionSortKey;
  direction: 'asc' | 'desc';
}

/** Draft filter state held in local React state (before "Apply"). */
export interface PositionsDraftFilters {
  dateFrom: string;
  dateTo: string;
  search: string;
  status: string;
  service: string;
  governorate: string;
}
