export { abmPositionSortByValues, abmPositionSortDirectionValues, abmPositionPageSizeValues, } from '@delivery-commerce/shared';
// ─── Frontend-only types ──────────────────────────────────────────────────────
export const ABM_POSITION_STATUS_LABELS = {
    created: 'Créée',
    progress: 'En cours',
    delivered: 'Livrée',
    anomaly: 'Anomalie',
    return: 'Retour',
    cancelled: 'Annulée',
    neutral: 'Neutre',
};
/** Human-readable status label keyed by the backend statusCategory. */
export function getStatusLabel(category) {
    return ABM_POSITION_STATUS_LABELS[category] ?? category;
}
/** Status badge style keyed by the backend statusCategory. */
export const STATUS_BADGE_STYLES = {
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
];
export const ABM_SERVICES = ['ONP', 'BLK', 'FIX'];
