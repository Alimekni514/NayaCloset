import { downloadPositionLabelPdf } from './position-label-pdf-generator';
export class PopupBlockedError extends Error {
    constructor() {
        super('POPUP_BLOCKED');
    }
}
export const getPositionLabelActionVariant = (action) => action.endsWith('zebra') ? 'zebra' : 'normal';
export const getPositionLabelActionKind = (action) => action.startsWith('preview') ? 'preview' : 'pdf';
export const isPreviewAction = (action) => action.startsWith('preview');
export function createPreviewPopup(action) {
    if (!isPreviewAction(action)) {
        return null;
    }
    return window.open('', '_blank');
}
export function setPreviewLoadingDocument(popup) {
    if (!popup) {
        return;
    }
    popup.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8" /><title>Preparation</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Arial,sans-serif;color:#111827;background:#fff}p{padding:24px;font-size:16px}</style></head><body><p>Preparation de l\'etiquette...</p></body></html>');
    popup.document.close();
}
const buildPdfPreviewHtml = (pdfUrl, title) => [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${title}</title>`,
    '<style>',
    'html, body { margin: 0; padding: 0; background: #f8fafc; }',
    'body { min-height: 100vh; }',
    '.frame { width: 100vw; height: 100vh; border: 0; background: #fff; }',
    '</style>',
    '</head>',
    '<body>',
    `<iframe class="frame" title="${title}" src="${pdfUrl}"></iframe>`,
    '</body>',
    '</html>',
].join('');
const buildDefaultFilename = (positionId, variant, contentType) => {
    const normalizedType = contentType.toLowerCase();
    const extension = normalizedType.includes('pdf')
        ? 'pdf'
        : normalizedType.includes('html')
            ? 'html'
            : normalizedType.includes('text/plain')
                ? 'zpl'
                : 'bin';
    return `ABM-position-${positionId}-${variant}.${extension}`;
};
export async function presentPositionLabelDocument({ label, action, positionId, popup, }) {
    const variant = getPositionLabelActionVariant(action);
    const kind = getPositionLabelActionKind(action);
    const filename = label.filename ?? buildDefaultFilename(positionId, variant, label.contentType);
    const objectUrl = URL.createObjectURL(label.blob);
    const urlsToRevoke = [objectUrl];
    if (kind === 'preview') {
        if (!popup || popup.closed) {
            URL.revokeObjectURL(objectUrl);
            throw new PopupBlockedError();
        }
        if (label.contentType.toLowerCase().includes('application/pdf')) {
            const wrapperBlob = new Blob([buildPdfPreviewHtml(objectUrl, filename)], {
                type: 'text/html; charset=utf-8',
            });
            const wrapperUrl = URL.createObjectURL(wrapperBlob);
            urlsToRevoke.push(wrapperUrl);
            popup.location.replace(wrapperUrl);
        }
        else {
            popup.location.replace(objectUrl);
        }
        window.setTimeout(() => {
            for (const url of urlsToRevoke) {
                URL.revokeObjectURL(url);
            }
        }, 60_000);
        return { filename, objectUrl: urlsToRevoke.at(-1) ?? objectUrl };
    }
    else {
        // Generate PDF client-side
        const htmlContent = await label.blob.text();
        // Use .pdf extension for the generated file
        const pdfFilename = filename.replace(/\.html$/i, '.pdf');
        await downloadPositionLabelPdf({
            positionId,
            variant,
            htmlContent,
            filename: pdfFilename,
        });
        // Cleanup the objectURL we created but didn't use for popup
        URL.revokeObjectURL(objectUrl);
        return { filename: pdfFilename, objectUrl: '' };
    }
}
