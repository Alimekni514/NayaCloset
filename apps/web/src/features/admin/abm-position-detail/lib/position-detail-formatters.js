const TUNISIA_TIME_ZONE = 'Africa/Tunis';
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TUNISIA_TIME_ZONE,
});
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TUNISIA_TIME_ZONE,
});
export function formatDetailDate(iso) {
    if (!iso) {
        return 'Non disponible';
    }
    return dateFormatter.format(new Date(iso));
}
export function formatDetailTime(iso) {
    if (!iso) {
        return 'Non disponible';
    }
    return timeFormatter.format(new Date(iso));
}
export function formatDetailDateTime(iso) {
    if (!iso) {
        return 'Non disponible';
    }
    return `${formatDetailDate(iso)} · ${formatDetailTime(iso)}`;
}
export function formatOptionalText(value) {
    const normalized = value?.trim() ?? '';
    return normalized || 'Non disponible';
}
export function formatMetric(value, unit) {
    if (value == null || Number.isNaN(value)) {
        return 'Non disponible';
    }
    return `${new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value)} ${unit}`;
}
export function formatCod(value) {
    if (value == null || Number.isNaN(value)) {
        return 'Non disponible';
    }
    return `${new Intl.NumberFormat('fr-TN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(value)} TND`;
}
