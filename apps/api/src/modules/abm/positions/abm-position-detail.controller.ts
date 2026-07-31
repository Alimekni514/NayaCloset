import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getAbmPositionDetail } from './abm-position-detail.service';
import { buildPositionLabelPreview } from './abm-position-label.service';
import { generatePositionLabelPdf } from './abm-position-label-pdf.service';
import type { AbmDetailPrintVariant } from './abm-position-detail.types';

const setNoStoreHeaders = (res: Response) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
};

/**
 * Strict Content-Security-Policy for sanitized label HTML pages.
 * Allows inline styles (needed for label formatting) and inline scripts
 * (needed for JsBarcode), but blocks all remote resources and frames.
 */
const LABEL_HTML_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; script-src 'unsafe-inline'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

export const getAbmPositionDetailController = async (req: Request, res: Response) => {
  const position = await getAbmPositionDetail(String(req.params.positionId));
  res.status(StatusCodes.OK).json({ position });
};

/**
 * Preview endpoint — returns sanitized printable HTML with inline disposition.
 * The popup opened synchronously on the frontend navigates to a Blob URL of this content.
 * Content-Type is always text/html; never application/pdf.
 */
export const getAbmPositionLabelPreviewController = async (
  req: Request,
  res: Response,
  variant: AbmDetailPrintVariant,
) => {
  const preview = await buildPositionLabelPreview({
    positionId: String(req.params.positionId),
    format: variant,
  });

  setNoStoreHeaders(res);
  res.setHeader('Content-Security-Policy', LABEL_HTML_CSP);
  res.setHeader('Content-Type', preview.contentType);
  res.setHeader('Content-Disposition', `inline; filename="${preview.filename}"`);
  res.setHeader('Content-Length', String(preview.contentLength));

  res.status(StatusCodes.OK).send(preview.body);
};

/**
 * Download endpoint — returns the same sanitized printable HTML with attachment disposition.
 * The filename uses the .html extension because the content IS HTML, not PDF.
 * Users can open the downloaded file in a browser and use File > Print > Save as PDF.
 * Content-Type is always text/html; never application/pdf.
 */
export const getAbmPositionLabelPdfController = async (
  req: Request,
  res: Response,
  variant: AbmDetailPrintVariant,
) => {
  const document = await generatePositionLabelPdf({
    positionId: String(req.params.positionId),
    format: variant,
  });

  const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';

  setNoStoreHeaders(res);
  res.setHeader('Content-Security-Policy', LABEL_HTML_CSP);
  // Content-Type is text/html — this is NOT a PDF byte stream.
  res.setHeader('Content-Type', document.contentType);
  // Filename uses .html extension — truthful about the actual format returned.
  res.setHeader('Content-Disposition', `${disposition}; filename="${document.filename}"`);
  res.setHeader('Content-Length', String(document.contentLength));

  res.status(StatusCodes.OK).send(document.body);
};

/**
 * Legacy single-path label route — delegates to preview.
 */
export const getAbmPositionLabelController = async (
  req: Request,
  res: Response,
  variant: AbmDetailPrintVariant,
) => {
  await getAbmPositionLabelPreviewController(req, res, variant);
};
