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
  it('requests inline label previews through the authenticated api client', async () => {
    // The preview endpoint returns sanitized HTML (not PDF) — ABM label pages are HTML.
    getMock.mockResolvedValueOnce({
      status: 200,
      data: new Blob(['<!doctype html><html>...</html>'], { type: 'text/html; charset=utf-8' }),
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // The route still uses the /labels/normal/pdf path with ?disposition=inline
        // for backward compatibility, but returns HTML with an .html filename.
        'content-disposition': 'inline; filename="ABM-position-467642-normal.html"',
      },
    });

    const result = await fetchAbmPositionLabelDocument('467642', 'normal', 'preview');

    expect(getMock).toHaveBeenCalledWith('/admin/abm/positions/467642/labels/normal/pdf?disposition=inline', {
      responseType: 'blob',
    });
    expect(result.contentType).toBe('text/html; charset=utf-8');
    expect(result.filename).toBe('ABM-position-467642-normal.html');
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('requests label downloads through the authenticated api client', async () => {
    // The download endpoint returns sanitized HTML with attachment disposition.
    // Filename uses .html — truthful about the actual content type returned.
    getMock.mockResolvedValueOnce({
      status: 200,
      data: new Blob(['<!doctype html><html>...</html>'], { type: 'text/html; charset=utf-8' }),
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-disposition': 'attachment; filename="ABM-position-467642-zebra.html"',
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
      data: new Blob([], { type: 'text/html; charset=utf-8' }),
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });

    await expect(fetchAbmPositionLabelDocument('467642', 'normal', 'preview')).rejects.toMatchObject({
      status: 502,
      message: 'ABM a retourne une etiquette vide.',
      details: { code: 'ABM_LABEL_EMPTY' },
    });
  });
});
