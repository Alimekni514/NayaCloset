import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createPreviewPopup,
  getPositionLabelActionKind,
  getPositionLabelActionVariant,
  PopupBlockedError,
  presentPositionLabelDocument,
} from './position-label-download';

describe('position label download helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockUrlApis = () => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  };

  it('maps actions to the expected variant and document kind', () => {
    expect(getPositionLabelActionVariant('preview-normal')).toBe('normal');
    expect(getPositionLabelActionVariant('pdf-zebra')).toBe('zebra');
    expect(getPositionLabelActionKind('preview-zebra')).toBe('preview');
    expect(getPositionLabelActionKind('pdf-normal')).toBe('pdf');
  });

  it('opens a popup only for preview actions', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    expect(createPreviewPopup('preview-normal')).toBeTruthy();
    expect(createPreviewPopup('pdf-zebra')).toBeNull();
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('', '_blank');
  });

  it('creates and revokes a blob URL for preview actions', () => {
    vi.useFakeTimers();
    mockUrlApis();
    const replaceSpy = vi.fn();
    const popup = { closed: false, location: { replace: replaceSpy } } as unknown as Window;
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:pdf')
      .mockReturnValueOnce('blob:preview');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    presentPositionLabelDocument({
      label: {
        blob: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
        filename: 'ABM-position-469384-normal.pdf',
      },
      action: 'preview-normal',
      positionId: '469384',
      popup,
    });

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);
    expect(replaceSpy).toHaveBeenCalledWith('blob:preview');
    expect(revokeObjectUrlSpy).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:pdf');
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:preview');
  });

  it('downloads PDF actions instead of opening them', () => {
    vi.useFakeTimers();
    mockUrlApis();
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = clickSpy;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    presentPositionLabelDocument({
      label: {
        blob: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
        contentType: 'application/pdf',
        filename: 'ABM-position-469384-zebra.pdf',
      },
      action: 'pdf-zebra',
      positionId: '469384',
      popup: null,
    });

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('ABM-position-469384-zebra.pdf');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.runAllTimers();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:pdf');
  });

  it('throws a popup-blocked error if a preview action has no popup window', () => {
    mockUrlApis();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:blocked');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    expect(() =>
      presentPositionLabelDocument({
        label: {
          blob: new Blob(['safe'], { type: 'text/html' }),
          contentType: 'text/html; charset=utf-8',
          filename: 'ABM-position-469384-normal.html',
        },
        action: 'preview-normal',
        positionId: '469384',
        popup: null,
      }),
    ).toThrow(PopupBlockedError);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:blocked');
  });
});
