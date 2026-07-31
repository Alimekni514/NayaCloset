export function formatTND(value) {
    return `${new Intl.NumberFormat("fr-TN", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    }).format(value)} TND`;
}
export function formatMillimesTnd(value) {
    return formatTND(value / 1000);
}
export function formatDate(iso) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(iso));
}
export function formatDateTime(iso) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}
