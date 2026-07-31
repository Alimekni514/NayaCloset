import { describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: getMock,
  },
}));

import { fetchAbmPositionLabelDocument } from './abm-position-detail-api';

describe('abm position detail api label documents', () => {
  it('requests inline pdf previews through the authenticated api client', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'inline; filename="ABM-position-467642-normal.pdf"',
      },
    });

    const result = await fetchAbmPositionLabelDocument('467642', 'normal', 'preview');

    expect(getMock).toHaveBeenCalledWith('/admin/abm/positions/467642/labels/normal/pdf?disposition=inline', {
      responseType: 'blob',
    });
    expect(result.contentType).toBe('application/pdf');
    expect(result.filename).toBe('ABM-position-467642-normal.pdf');
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('requests pdf downloads through the authenticated api client', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="ABM-position-467642-zebra.pdf"',
      },
    });

    await fetchAbmPositionLabelDocument('467642', 'zebra', 'pdf');

    expect(getMock).toHaveBeenCalledWith('/admin/abm/positions/467642/labels/zebra/pdf', {
      responseType: 'blob',
    });
  });

  it('rejects empty label blobs with a safe error envelope', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: new Blob([], { type: 'application/pdf' }),
      headers: {
        'content-type': 'application/pdf',
      },
    });

    await expect(fetchAbmPositionLabelDocument('467642', 'normal', 'preview')).rejects.toMatchObject({
      status: 502,
      message: 'ABM a retourne une etiquette vide.',
      details: { code: 'ABM_LABEL_EMPTY' },
    });
  });
});
