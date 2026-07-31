/** Format a date string to a short French date format. */
export function formatShortDate(iso) {
    if (!iso)
        return '—';
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(iso));
}
/** Format a date string to a short time format. */
export function formatShortTime(iso) {
    if (!iso)
        return '';
    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}
/** Returns today's date in YYYY-MM-DD format, timezone-aware. */
export function todayISODate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
/** Copy a string to the clipboard (gracefully fails if unavailable). */
export async function copyToClipboard(value) {
    try {
        await navigator.clipboard.writeText(value);
    }
    catch {
        /* clipboard unavailable */
    }
}
