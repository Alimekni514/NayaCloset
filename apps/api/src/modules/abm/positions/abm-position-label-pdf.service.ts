import { buildPositionLabelDocument, buildPdfFilename } from './abm-position-label.service';
import type { AbmDetailPrintVariant } from './abm-position-detail.types';

/**
 * Result of generating a printable label document.
 * The document is always returned as HTML — it is NOT a PDF byte stream.
 * The browser can print/save-as-PDF natively from the preview popup.
 */
export type AbmPositionPrintableDocumentResult = {
  body: Buffer;
  /** Always text/html; charset=utf-8 — never application/pdf */
  contentType: 'text/html; charset=utf-8';
  contentLength: number;
  /** Filename uses .html extension — the document is HTML, not PDF */
  filename: string;
};

/**
 * Optional renderer injected in tests. When null the production HTML path is used.
 * Signature accepts the HTML string and position variant for test assertions.
 */
type PdfRenderer = ((html: string, variant: AbmDetailPrintVariant) => Promise<Buffer>) | null;

let _pdfRenderer: PdfRenderer = null;

/**
 * Test-only hook to override the document renderer.
 * Call with null in beforeEach to reset to the default HTML path.
 */
export const __setPositionLabelPdfRendererForTests = (renderer: PdfRenderer): void => {
  _pdfRenderer = renderer;
};

/**
 * Build a printable label document for the given position and format.
 *
 * Production: returns sanitized HTML fetched from ABM, wrapped with print CSS
 * and barcode libraries. The response is Content-Type: text/html — NOT a PDF.
 * Users can save as PDF using the browser's native print dialog.
 *
 * Tests: if a renderer has been injected via __setPositionLabelPdfRendererForTests,
 * the renderer is called with the HTML string. This lets tests assert on the content
 * that would be passed to a hypothetical PDF renderer, while still keeping the
 * production code free of Playwright.
 */
export const generatePositionLabelPdf = async ({
  positionId,
  format,
}: {
  positionId: string;
  format: AbmDetailPrintVariant;
}): Promise<AbmPositionPrintableDocumentResult> => {
  const document = await buildPositionLabelDocument({
    positionId,
    format,
    mode: 'pdf',
  });

  // If a test renderer is injected, pass the HTML to it for assertion purposes.
  // The renderer result is not used in production — the HTML is always returned.
  if (_pdfRenderer !== null) {
    await _pdfRenderer(document.body.toString('utf-8'), format);
  }

  // Always return the HTML document with a truthful .html filename.
  // The route that calls this function sets Content-Disposition: attachment
  // so the browser will download the file. The user can then open it and
  // use File > Print > Save as PDF to generate an actual PDF.
  const htmlFilename = buildPdfFilename(positionId, format).replace(/\.pdf$/u, '.html');

  return {
    body: document.body,
    contentType: 'text/html; charset=utf-8',
    contentLength: document.contentLength,
    filename: htmlFilename,
  };
};
