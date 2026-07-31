import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getAbmPositionDetail } from './abm-position-detail.service';
import { buildPositionLabelPreview } from './abm-position-label.service';
import type { AbmDetailPrintVariant } from './abm-position-detail.types';

const setNoStoreHeaders = (res: Response) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
};

export const getAbmPositionDetailController = async (req: Request, res: Response) => {
  const position = await getAbmPositionDetail(String(req.params.positionId));
  res.status(StatusCodes.OK).json({ position });
};

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
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; script-src 'unsafe-inline'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  res.setHeader('Content-Type', preview.contentType);
  res.setHeader('Content-Disposition', `inline; filename="${preview.filename}"`);
  res.setHeader('Content-Length', String(preview.contentLength));

  res.status(StatusCodes.OK).send(preview.body);
};

import { fetchUpstreamPositionLabel } from './abm-position-label.service';

export const getAbmPositionLabelPdfController = async (
  req: Request,
  res: Response,
  variant: AbmDetailPrintVariant,
) => {
  const upstream = await fetchUpstreamPositionLabel({
    positionId: String(req.params.positionId),
    format: variant,
  });
  const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
  const filename = `ABM-position-${req.params.positionId}-${variant}.${upstream.category === 'zpl' ? 'zpl' : (upstream.category === 'image' ? 'png' : 'pdf')}`;

  setNoStoreHeaders(res);
  res.setHeader('Content-Type', upstream.contentType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  res.setHeader('Content-Length', String(upstream.contentLength));

  res.status(StatusCodes.OK).send(upstream.body);
};

export const getAbmPositionLabelController = async (
  req: Request,
  res: Response,
  variant: AbmDetailPrintVariant,
) => {
  await getAbmPositionLabelPreviewController(req, res, variant);
};
