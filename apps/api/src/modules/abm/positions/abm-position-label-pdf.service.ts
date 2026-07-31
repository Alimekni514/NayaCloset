import type { Browser } from 'playwright';
import { chromium } from 'playwright';

import { createAbmHttpError } from '../abm.errors';

import { buildPdfFilename, buildPositionLabelDocument } from './abm-position-label.service';
import type { AbmDetailPrintVariant } from './abm-position-detail.types';

type PdfRenderer = (html: string) => Promise<Buffer>;

let browserPromise: Promise<Browser> | null = null;
let closeHooksRegistered = false;
let rendererOverride: PdfRenderer | null = null;

const ensureBrowser = async (): Promise<Browser> => {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }

  if (!closeHooksRegistered) {
    closeHooksRegistered = true;
    const closeBrowser = async () => {
      if (!browserPromise) {
        return;
      }

      const browser = await browserPromise.catch(() => null);
      browserPromise = null;

      if (browser) {
        await browser.close().catch(() => undefined);
      }
    };

    process.once('beforeExit', () => {
      void closeBrowser();
    });
    process.once('SIGINT', () => {
      void closeBrowser();
    });
    process.once('SIGTERM', () => {
      void closeBrowser();
    });
  }

  return browserPromise;
};

const renderHtmlToPdf = async (html: string): Promise<Buffer> => {
  const browser = await ensureBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 20_000,
    });
    await page.emulateMedia({ media: 'print' });
    await page.waitForFunction(() => (window as Window & { __ABM_LABEL_READY?: boolean }).__ABM_LABEL_READY !== false, {
      timeout: 10_000,
    });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    return Buffer.from(pdf);
  } catch {
    throw createAbmHttpError('ABM_LABEL_PDF_GENERATION_FAILED');
  } finally {
    await page.close().catch(() => undefined);
  }
};

export const __setPositionLabelPdfRendererForTests = (renderer: PdfRenderer | null): void => {
  rendererOverride = renderer;
};

export const generatePositionLabelPdf = async ({
  positionId,
  format,
}: {
  positionId: string;
  format: AbmDetailPrintVariant;
}): Promise<{
  body: Buffer;
  filename: string;
  previewCategory: string;
}> => {
  const preview = await buildPositionLabelDocument({ positionId, format, mode: 'pdf' });
  const html = preview.body.toString('utf-8');
  const renderer = rendererOverride ?? renderHtmlToPdf;
  const body = await renderer(html);

  if (body.length === 0 || !body.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    throw createAbmHttpError('ABM_LABEL_PDF_GENERATION_FAILED');
  }

  return {
    body,
    filename: buildPdfFilename(positionId, format),
    previewCategory: preview.category,
  };
};
