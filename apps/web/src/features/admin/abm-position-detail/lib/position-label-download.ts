import type {
  AbmLabelDocumentKind,
  AbmLabelVariant,
  AbmPositionLabelBlobResponse,
} from '../api/abm-position-detail-api';

export type PositionLabelAction =
  | 'preview-normal'
  | 'pdf-normal'
  | 'preview-zebra'
  | 'pdf-zebra';

export class PopupBlockedError extends Error {
  public constructor() {
    super('POPUP_BLOCKED');
  }
}

export const getPositionLabelActionVariant = (action: PositionLabelAction): AbmLabelVariant =>
  action.endsWith('zebra') ? 'zebra' : 'normal';

export const getPositionLabelActionKind = (action: PositionLabelAction): AbmLabelDocumentKind =>
  action.startsWith('preview') ? 'preview' : 'pdf';

export const isPreviewAction = (action: PositionLabelAction): boolean => action.startsWith('preview');

export function openPreviewPopup(url: string): Window | null {
  return window.open(url, '_blank', 'noopener,noreferrer');
}

const buildPdfPreviewHtml = (pdfUrl: string, title: string) =>
  [
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

const buildDefaultFilename = (
  positionId: string,
  variant: AbmLabelVariant,
  contentType: string,
) => {
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

export function presentPositionLabelDocument({
  label,
  action,
  positionId,
}: {
  label: AbmPositionLabelBlobResponse;
  action: PositionLabelAction;
  positionId: string;
}) {
  const variant = getPositionLabelActionVariant(action);
  const kind = getPositionLabelActionKind(action);
  const filename = label.filename ?? buildDefaultFilename(positionId, variant, label.contentType);
  const objectUrl = URL.createObjectURL(label.blob);
  const urlsToRevoke = [objectUrl];

  if (kind === 'preview') {
    let finalUrl = objectUrl;
    if (label.contentType.toLowerCase().includes('application/pdf')) {
      const wrapperBlob = new Blob([buildPdfPreviewHtml(objectUrl, filename)], {
        type: 'text/html; charset=utf-8',
      });
      const wrapperUrl = URL.createObjectURL(wrapperBlob);
      urlsToRevoke.push(wrapperUrl);
      finalUrl = wrapperUrl;
    }

    const popup = openPreviewPopup(finalUrl);
    if (!popup) {
      for (const url of urlsToRevoke) {
        URL.revokeObjectURL(url);
      }
      throw new PopupBlockedError();
    }
  } else {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.click();
  }

  window.setTimeout(() => {
    for (const url of urlsToRevoke) {
      URL.revokeObjectURL(url);
    }
  }, 60_000);

  return { filename, objectUrl: urlsToRevoke.at(-1) ?? objectUrl };
}
