import { formatShortDate } from './position-formatters';
/** Build CSV rows for the current positions list. */
function buildCsvRows(positions) {
    const header = [
        'Position',
        'Référence',
        'Créée le',
        'Destinataire',
        'Téléphone',
        'Gouvernorat',
        'Ville',
        'Service',
        'COD',
        'Statut',
        'Tentatives',
    ];
    const rows = positions.map((p) => [
        p.barcode,
        p.reference,
        formatShortDate(p.createdAt),
        p.recipient.fullName,
        p.recipient.phone,
        p.destination.governorate,
        p.destination.city,
        p.service,
        String(p.codAmount),
        p.statusLabel,
        String(p.deliveryAttempts),
    ]);
    return [header, ...rows];
}
/** Convert rows to a semicolon-delimited CSV string with UTF-8 BOM. */
function rowsToCsv(rows) {
    const csv = rows
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
        .join('\n');
    return `\uFEFF${csv}`;
}
/** Export positions as a CSV file download. */
export function exportPositionsCsv(positions, filename = 'positions-abm.csv') {
    const blob = new Blob([rowsToCsv(buildCsvRows(positions))], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
/** Copy positions as CSV text to the clipboard. */
export async function copyPositionsCsv(positions) {
    const csv = rowsToCsv(buildCsvRows(positions));
    try {
        await navigator.clipboard.writeText(csv);
    }
    catch {
        /* clipboard unavailable */
    }
}
/** Print the current page. */
export function printPositions() {
    window.print();
}
