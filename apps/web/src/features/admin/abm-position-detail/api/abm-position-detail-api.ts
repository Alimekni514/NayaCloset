import type { AxiosResponse } from 'axios';
import type { AbmPositionDetailResponse } from '@delivery-commerce/shared';

import { apiClient } from '@/lib/api-client';

export type AbmLabelVariant = 'normal' | 'zebra';
export type AbmLabelDocumentKind = 'preview' | 'pdf';

export type AbmPositionLabelBlobResponse = {
  blob: Blob;
  contentType: string;
  filename: string | null;
};

type LabelErrorPayload = {
  message?: string;
  requestId?: string;
  issues?: unknown;
  details?: unknown;
};

export async function getAbmPositionDetail(positionId: string) {
  const response = await apiClient.get<AbmPositionDetailResponse>(`/admin/abm/positions/${positionId}`);
  return response.data.position;
}

const parseFilename = (contentDisposition: string | undefined): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const bareMatch = contentDisposition.match(/filename=([^;]+)/i);
  return bareMatch?.[1]?.trim() ?? null;
};

const toBlob = (response: AxiosResponse<Blob>): AbmPositionLabelBlobResponse => ({
  blob: response.data,
  contentType: String(response.headers['content-type'] ?? response.data.type ?? 'application/octet-stream'),
  filename: parseFilename(response.headers['content-disposition']),
});

const getDocumentPath = (
  positionId: string,
  variant: AbmLabelVariant,
  kind: AbmLabelDocumentKind,
): string => {
  const encodedId = encodeURIComponent(positionId);

  if (kind === 'preview') {
    return `/admin/abm/positions/${encodedId}/labels/${variant}/pdf?disposition=inline`;
  }

  return `/admin/abm/positions/${encodedId}/labels/${variant}/pdf`;
};

const createLabelApiError = (
  status: number,
  fallbackMessage: string,
  payload?: LabelErrorPayload,
) => ({
  status,
  message: payload?.message ?? fallbackMessage,
  ...(payload?.requestId ? { requestId: payload.requestId } : {}),
  ...(payload?.issues !== undefined ? { issues: payload.issues } : {}),
  ...(payload?.details !== undefined ? { details: payload.details } : {}),
});

const parseJsonBlobError = async (response: AxiosResponse<Blob>) => {
  const text = await response.data.text();
  const fallbackError = createLabelApiError(response.status, 'Impossible de previsualiser l\'etiquette.');

  try {
    const payload = JSON.parse(text) as LabelErrorPayload;
    return Promise.reject(createLabelApiError(response.status, fallbackError.message, payload));
  } catch {
    return Promise.reject(fallbackError);
  }
};

const ensureValidLabelBlob = async (
  response: AxiosResponse<Blob>,
): Promise<AbmPositionLabelBlobResponse> => {
  const label = toBlob(response);
  const normalizedType = label.contentType.toLowerCase();

  if (normalizedType.includes('application/json')) {
    await parseJsonBlobError(response);
  }

  if (label.blob.size === 0) {
    throw createLabelApiError(502, 'ABM a retourne une etiquette vide.', {
      details: { code: 'ABM_LABEL_EMPTY' },
    });
  }

  return label;
};

export async function fetchAbmPositionLabelDocument(
  positionId: string,
  variant: AbmLabelVariant,
  kind: AbmLabelDocumentKind,
): Promise<AbmPositionLabelBlobResponse> {
  const response = await apiClient.get<Blob>(getDocumentPath(positionId, variant, kind), {
    responseType: 'blob',
  });

  return ensureValidLabelBlob(response);
}
