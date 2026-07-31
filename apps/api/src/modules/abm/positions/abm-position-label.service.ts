import * as cheerio from 'cheerio';

import { HttpError } from '../../../lib/http-error';
import { logger } from '../../../config/logger';

import { createAbmHttpError } from '../abm.errors';
import { getAbmSessionManager } from '../index';

import type { AbmDetailPrintVariant } from './abm-position-detail.types';

const ABM_LABEL_PATH_PREFIXES: Record<AbmDetailPrintVariant, string> = {
  normal: '/cPosition/etiquette_colis/',
  zebra: '/cPosition/etiquette_colis_zebra/',
};

const BARCODE_LIBRARY_PATH = '/template2/JsBarcode.all.js';
const PRINT_CSS_PATH = '/Content/print.css';
const POSITION_ID_PATTERN = /^\d{1,18}$/;
const IMAGE_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

type LabelCategory =
  | 'pdf'
  | 'image'
  | 'html'
  | 'zpl'
  | 'login_html'
  | 'redirect'
  | 'empty'
  | 'unsupported';

type UpstreamLabelPayload = {
  body: Buffer;
  contentType: string;
  contentLength: number;
  contentDisposition: string;
  category: LabelCategory;
  finalUrl: string;
  status: number;
  upstreamPath: string;
};

export type AbmPositionLabelPreviewResult = {
  body: Buffer;
  contentType: 'text/html; charset=utf-8';
  contentLength: number;
  filename: string;
  category: LabelCategory;
  upstreamPath: string;
  upstreamStatus: number;
};

const textAssetCache = new Map<string, string>();

const getHeaderValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

const isLoginHtml = (html: string): boolean =>
  /__RequestVerificationToken/iu.test(html) && /UserName/iu.test(html);

const startsWithPdf = (body: Buffer): boolean => body.subarray(0, 4).equals(Buffer.from('%PDF'));

const isLikelyZpl = (body: Buffer): boolean => {
  const preview = body.subarray(0, 2048).toString('utf-8').trim();
  return preview.startsWith('^XA') && preview.includes('^XZ');
};

export const classifyLabelResponse = (
  contentType: string,
  contentDisposition: string,
  body: Buffer,
  finalUrl: string,
): LabelCategory => {
  if (finalUrl.includes('/Authentification/Login')) {
    return 'redirect';
  }

  if (body.length === 0) {
    return 'empty';
  }

  const normalizedType = contentType.toLowerCase();
  const normalizedDisposition = contentDisposition.toLowerCase();
  const preview = body.subarray(0, 2048).toString('utf-8');

  if (normalizedType.includes('application/pdf') || startsWithPdf(body)) {
    return 'pdf';
  }

  if ([...IMAGE_CONTENT_TYPES].some((type) => normalizedType.includes(type))) {
    return 'image';
  }

  if (normalizedType.includes('text/html')) {
    return isLoginHtml(preview) ? 'login_html' : 'html';
  }

  if (
    normalizedType.startsWith('text/plain') ||
    normalizedType.includes('application/octet-stream') ||
    normalizedDisposition.endsWith('.zpl"') ||
    isLikelyZpl(body)
  ) {
    return 'zpl';
  }

  return 'unsupported';
};

const buildHtmlFilename = (positionId: string, variant: AbmDetailPrintVariant): string =>
  `ABM-position-${positionId}-${variant}.html`;

export const buildPdfFilename = (positionId: string, variant: AbmDetailPrintVariant): string =>
  `ABM-position-${positionId}-${variant}.pdf`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeWhitespace = (value: string): string => value.replace(/\s+/gu, ' ').trim();

const stripDangerousAttributes = (markup: string): string =>
  markup.replace(/\s+on[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/giu, '');

const inlineAbmAsset = async (path: string): Promise<string> => {
  const cached = textAssetCache.get(path);
  if (cached) {
    return cached;
  }

  const manager = getAbmSessionManager();
  const response = await manager.getProtectedTextDetailed(path, {}, { maxRedirects: 0 });
  const contentType = String(response.headers['content-type'] ?? '').toLowerCase();

  if (!contentType.includes('text') && !contentType.includes('javascript') && !contentType.includes('css')) {
    throw createAbmHttpError('ABM_LABEL_FETCH_FAILED');
  }

  textAssetCache.set(path, response.data);
  return response.data;
};

const buildBarcodeScript = (scriptContents: string[]): string => {
  const cleaned = scriptContents
    .map((script) => script.trim())
    .filter(
      (script) =>
        script.length > 0 &&
        /JsBarcode\s*\(/u.test(script) &&
        !/window\.(open|print|close)/u.test(script),
    );

  if (cleaned.length === 0) {
    return 'window.__ABM_LABEL_READY = true;';
  }

  return [
    'window.__ABM_LABEL_READY = false;',
    'try {',
    ...cleaned,
    '} finally {',
    'window.__ABM_LABEL_READY = true;',
    '}',
  ].join('\n');
};

const removeAutoPrintScripts = ($root: cheerio.Cheerio<any>) => {
  const barcodeScripts: string[] = [];

  $root.find('script').each((_, element) => {
    const script = $root.find(element);
    const content = script.html() ?? '';

    if (/JsBarcode\s*\(/u.test(content) && !/window\.(open|print|close)/u.test(content)) {
      barcodeScripts.push(content);
    }

    script.remove();
  });

  return barcodeScripts;
};

const sanitizePrintableMarkup = (markup: string): { contentHtml: string; barcodeScripts: string[] } => {
  const $ = cheerio.load(markup);
  const $printRoot = $('#printit').first().length > 0 ? $('#printit').first() : $('body').first();

  if ($printRoot.length === 0) {
    throw createAbmHttpError('ABM_LABEL_FETCH_FAILED');
  }

  const barcodeScripts = removeAutoPrintScripts($printRoot);

  $printRoot.find('iframe, object, embed, form, meta, link').remove();
  $printRoot.find('a').each((_, element) => {
    const $element = $(element);
    $element.replaceWith(`<span>${$element.html() ?? ''}</span>`);
  });

  $printRoot.find('*').each((_, element) => {
    const attribs = { ...element.attribs };
    for (const [name, value] of Object.entries(attribs)) {
      if (/^on/iu.test(name)) {
        $(element).removeAttr(name);
        continue;
      }

      if ((name === 'src' || name === 'href') && /^https?:/iu.test(value)) {
        $(element).removeAttr(name);
      }
    }
  });

  return {
    contentHtml: stripDangerousAttributes($printRoot.html() ?? $printRoot.toString()),
    barcodeScripts,
  };
};

const normalizeNormalLabelSignatureRow = (markup: string): string => {
  const $ = cheerio.load(`<div id="__abm-root">${markup}</div>`);
  const $root = $('#__abm-root');

  $root.find('div').each((_, element) => {
    const $container = $(element);
    const style = $container.attr('style') ?? '';

    if (!/display\s*:\s*inline-flex/iu.test(style) || !/width\s*:\s*100%/iu.test(style)) {
      return;
    }

    const $children = $container.children('div');
    if ($children.length !== 3) {
      return;
    }

    const labels = $children
      .map((__, child) => normalizeWhitespace($(child).text()))
      .get();

    if (
      labels.length !== 3 ||
      !labels[0]?.includes('Collaborateur') ||
      !labels[1]?.includes('Date et heure') ||
      !labels[2]?.includes('Signature')
    ) {
      return;
    }

    $container.attr(
      'style',
      [
        'display:flex',
        'width:100%',
        'margin:0',
        'padding:0',
        'box-sizing:border-box',
        'align-items:stretch',
      ].join('; '),
    );

    const widths = ['38%', '24%', '38%'];
    $children.each((childIndex, child) => {
      $(child).attr(
        'style',
        [
          `flex:0 0 ${widths[childIndex]}`,
          `width:${widths[childIndex]}`,
          'margin:0',
          'padding:5px',
          'box-sizing:border-box',
          'border:1px solid #000',
          'overflow:hidden',
        ].join('; '),
      );
    });
  });

  return $root.html() ?? markup;
};

const buildWrappedPreviewHtml = async ({
  positionId,
  format,
  contentHtml,
  barcodeScripts,
  mode,
}: {
  positionId: string;
  format: AbmDetailPrintVariant;
  contentHtml: string;
  barcodeScripts: string[];
  mode: 'preview' | 'pdf';
}): Promise<string> => {
  const printCss = await inlineAbmAsset(PRINT_CSS_PATH);
  const barcodeLibrary = await inlineAbmAsset(BARCODE_LIBRARY_PATH);
  const title = `ABM position ${positionId} - ${format}`;
  const isNormal = format === 'normal';

  if (isNormal) {
    const normalizedContentHtml = normalizeNormalLabelSignatureRow(contentHtml);

    // -----------------------------------------------------------------------
    // Normal label: A4 Landscape — measured from official ABM reference PDF
    //   MediaBox: 841.92 × 594.96 pt = 297.01 × 209.89 mm
    // Preview mode: same HTML, browser Ctrl+P honours the @page rule.
    // PDF mode: same HTML loaded in an off-screen iframe and captured by
    //   html2canvas/jsPDF in the frontend PDF generator.
    // -----------------------------------------------------------------------
    return [
      '<!doctype html>',
      '<html lang="fr">',
      '<head>',
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<title>${escapeHtml(title)}</title>`,
      '<style>',
      // Exact A4 landscape – matches official ABM PDF dimensions
      '@page { size: 297mm 210mm landscape; margin: 0; }',
      'html {',
      '  background: #fff;',
      '  -webkit-print-color-adjust: exact;',
      '  print-color-adjust: exact;',
      '}',
      'body {',
      '  margin: 0;',
      '  padding: 3mm;',
      '  background: #fff;',
      '  color: #000;',
      '  font-family: "Times New Roman", "Liberation Serif", Times, serif;',
      '  font-size: 10pt;',
      '  line-height: 1.2;',
      '  width: 297mm;',
      '  min-height: 210mm;',
      '  box-sizing: border-box;',
      '  overflow: hidden;',
      '}',
      // Capture root — used by html2pdf to target the label
      '#abm-label-root {',
      '  width: 100%;',
      '  page-break-inside: avoid;',
      '  break-inside: avoid;',
      '  page-break-after: avoid;',
      '  break-after: avoid;',
      '}',
      // Tables: solid black borders, no rounded corners — matches official ABM
      'table { border-collapse: collapse; border-spacing: 0; width: 100%; }',
      'table[border="1"] { border: 2px solid #000; border-radius: 0; }',
      'table[border="1"] td, table[border="1"] th {',
      '  border: 1px solid #000;',
      '  padding: 2px 4px;',
      '  vertical-align: middle;',
      '  font-family: "Times New Roman", "Liberation Serif", Times, serif;',
      '}',
      // SVG barcodes — keep crisp
      'svg { display: block; overflow: visible; shape-rendering: crispEdges; text-rendering: geometricPrecision; }',
      'svg rect, svg path, svg line { shape-rendering: crispEdges; }',
      'svg text { fill: #000 !important; text-rendering: geometricPrecision; }',
      'svg[id^="barcode_"], svg[id^="barcodest_"] { background: #fff; }',
      // Links and inputs
      'a, a:visited, a:hover { color: inherit !important; text-decoration: none !important; }',
      'input[type="checkbox"] { accent-color: #8d8d8d; }',
      // Print media — ensure no browser default margins override @page
      '@media print {',
      '  html, body { margin: 0; padding: 3mm; width: 297mm; height: 210mm; overflow: hidden; }',
      '  #abm-label-root { page-break-inside: avoid !important; break-inside: avoid !important; }',
      '  .abm-print-toolbar { display: none !important; }',
      '}',
      printCss,
      '</style>',
      '</head>',
      '<body>',
      '<div id="abm-label-root">',
      normalizedContentHtml,
      '</div>',
      '<script>',
      barcodeLibrary,
      '</script>',
      '<script>',
      buildBarcodeScript(barcodeScripts),
      '</script>',
      '</body>',
      '</html>',
    ].join('\n');
  }

  // -------------------------------------------------------------------------
  // Zebra label — no official reference PDF available for pixel-perfect sizing.
  // Keep existing A4 preview layout; fix only renders the content cleanly.
  // TODO: provide official Zebra reference PDF for exact dimension calibration.
  // -------------------------------------------------------------------------
  const rootClass = 'print-variant-zebra';

  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    '@page { size: A4; margin: 10mm; }',
    'html, body { margin: 0; padding: 0; background: #fff; color: #111827; }',
    'body { font-family: Arial, sans-serif; }',
    '#abm-label-root {',
    '  width: 100%;',
    '  page-break-inside: avoid;',
    '  break-inside: avoid;',
    '}',
    '.preview-shell { padding: 24px; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; box-sizing: border-box; }',
    '.print-page { page-break-after: always; }',
    `.print-variant-zebra > * { width: 100%; max-width: 100%; margin: 0 auto; }`,
    '.preview-shell, .preview-shell * { color: #111111; }',
    '.preview-shell a, .preview-shell a:visited, .preview-shell a:hover { color: inherit !important; text-decoration: none !important; }',
    '.preview-shell table { border-collapse: collapse !important; border-spacing: 0 !important; }',
    '.preview-shell table, .preview-shell td, .preview-shell th { border-color: #b8b8b8 !important; }',
    '@media print { .preview-shell { padding: 0; display: block; } }',
    printCss,
    '</style>',
    '</head>',
    '<body>',
    `<main class="preview-shell"><section id="abm-label-root" class="print-page ${rootClass}">${contentHtml}</section></main>`,
    '<script>',
    barcodeLibrary,
    '</script>',
    '<script>',
    buildBarcodeScript(barcodeScripts),
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');
};


const buildPdfWrapperHtml = (positionId: string, variant: AbmDetailPrintVariant, body: Buffer): string => {
  const dataUrl = `data:application/pdf;base64,${body.toString('base64')}`;
  const title = `ABM position ${positionId} - ${variant} preview`;

  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    '@page { size: A4; margin: 10mm; }',
    'html, body { margin: 0; padding: 0; background: #fff; }',
    'body { font-family: Arial, sans-serif; }',
    '.pdf-frame { width: 100%; min-height: calc(100vh - 20mm); border: 0; }',
    '</style>',
    '</head>',
    '<body>',
    `<iframe class="pdf-frame" title="${escapeHtml(title)}" src="${dataUrl}"></iframe>`,
    '</body>',
    '</html>',
  ].join('\n');
};

const buildImageWrapperHtml = (
  positionId: string,
  variant: AbmDetailPrintVariant,
  body: Buffer,
  contentType: string,
): string => {
  const dataUrl = `data:${contentType};base64,${body.toString('base64')}`;
  const title = `ABM position ${positionId} - ${variant} preview`;

  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    '@page { size: A4; margin: 10mm; }',
    'html, body { margin: 0; padding: 0; background: #fff; }',
    'body { display: flex; justify-content: center; padding: 24px; }',
    'img { max-width: 100%; height: auto; }',
    '</style>',
    '</head>',
    '<body>',
    `<img src="${dataUrl}" alt="${escapeHtml(title)}" />`,
    '</body>',
    '</html>',
  ].join('\n');
};

const buildZplFallbackHtml = (positionId: string, variant: AbmDetailPrintVariant, body: Buffer): string => {
  const title = `ABM position ${positionId} - ${variant} fallback`;
  const rawZpl = normalizeWhitespace(body.toString('utf-8'));

  return [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    '@page { size: A4; margin: 10mm; }',
    'html, body { margin: 0; padding: 0; background: #fff; }',
    'body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }',
    '.zpl-card { border: 1px solid #d1d5db; border-radius: 16px; padding: 24px; }',
    'pre { white-space: pre-wrap; word-break: break-word; font-family: Consolas, monospace; background: #f8fafc; padding: 16px; border-radius: 12px; }',
    '</style>',
    '</head>',
    '<body>',
    '<section class="zpl-card">',
    '<h1>Etiquette Zebra technique</h1>',
    '<p>ABM a retourne un format ZPL brut. Un apercu texte de secours est affiche ci-dessous.</p>',
    `<pre>${escapeHtml(rawZpl)}</pre>`,
    '</section>',
    '</body>',
    '</html>',
  ].join('\n');
};

export const fetchUpstreamPositionLabel = async ({
  positionId,
  format,
}: {
  positionId: string;
  format: AbmDetailPrintVariant;
}): Promise<UpstreamLabelPayload> => {
  if (!POSITION_ID_PATTERN.test(positionId)) {
    throw createAbmHttpError('ABM_INVALID_POSITION_ID');
  }

  const upstreamPath = `${ABM_LABEL_PATH_PREFIXES[format]}${encodeURIComponent(positionId)}`;
  const sessionManager = getAbmSessionManager();
  const response = await sessionManager.getProtectedBufferDetailed(upstreamPath, {}, { maxRedirects: 0 });
  const contentType = getHeaderValue(response.headers['content-type']);
  const contentDisposition = getHeaderValue(response.headers['content-disposition']);
  const category = classifyLabelResponse(contentType, contentDisposition, response.data, response.finalUrl);

  logger.info(
    {
      route: `/api/admin/abm/positions/:positionId/labels/${format}`,
      positionId,
      upstreamPath,
      upstreamStatus: response.status,
      upstreamContentType: contentType,
      upstreamContentDisposition: contentDisposition,
      upstreamContentLength: response.data.length,
      upstreamCategory: category,
    },
    'ABM label response classified',
  );

  if (response.status === 404) {
    throw new HttpError(404, 'Cette position est introuvable.');
  }

  if (response.status >= 500) {
    throw createAbmHttpError('ABM_LABEL_FETCH_FAILED');
  }

  if (category === 'redirect' || category === 'login_html') {
    throw createAbmHttpError('ABM_LOGIN_FAILED');
  }

  if (category === 'empty') {
    throw createAbmHttpError('ABM_LABEL_EMPTY');
  }

  if (category === 'unsupported') {
    throw createAbmHttpError('ABM_LABEL_UNSUPPORTED_FORMAT');
  }

  return {
    body: response.data,
    contentType,
    contentLength: response.data.length,
    contentDisposition,
    category,
    finalUrl: response.finalUrl,
    status: response.status,
    upstreamPath,
  };
};

export const buildPositionLabelPreview = async ({
  positionId,
  format,
}: {
  positionId: string;
  format: AbmDetailPrintVariant;
}): Promise<AbmPositionLabelPreviewResult> => {
  return buildPositionLabelDocument({ positionId, format, mode: 'preview' });
};

export const buildPositionLabelDocument = async ({
  positionId,
  format,
  mode,
}: {
  positionId: string;
  format: AbmDetailPrintVariant;
  mode: 'preview' | 'pdf';
}): Promise<AbmPositionLabelPreviewResult> => {
  const upstream = await fetchUpstreamPositionLabel({ positionId, format });
  let html: string;

  if (upstream.category === 'html') {
    const sanitized = sanitizePrintableMarkup(upstream.body.toString('utf-8'));
    html = await buildWrappedPreviewHtml({
      positionId,
      format,
      contentHtml: sanitized.contentHtml,
      barcodeScripts: sanitized.barcodeScripts,
      mode,
    });
  } else if (upstream.category === 'pdf') {
    html = buildPdfWrapperHtml(positionId, format, upstream.body);
  } else if (upstream.category === 'image') {
    html = buildImageWrapperHtml(positionId, format, upstream.body, upstream.contentType);
  } else {
    html = buildZplFallbackHtml(positionId, format, upstream.body);
  }

  const body = Buffer.from(html, 'utf-8');

  return {
    body,
    contentType: 'text/html; charset=utf-8',
    contentLength: body.length,
    filename: buildHtmlFilename(positionId, format),
    category: upstream.category,
    upstreamPath: upstream.upstreamPath,
    upstreamStatus: upstream.status,
  };
};
