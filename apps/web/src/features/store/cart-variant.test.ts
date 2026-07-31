/**
 * Tests for cart composite key logic (color + size variant merging)
 */
import { describe, it, expect } from 'vitest';
import { cartLineKey } from '@/features/store/store-context';

describe('cartLineKey', () => {
  it('produces same key for same productId/color/size', () => {
    const a = cartLineKey({ productId: 'abc', selectedColor: 'Soft Yellow', selectedSize: 'M' });
    const b = cartLineKey({ productId: 'abc', selectedColor: 'Soft Yellow', selectedSize: 'M' });
    expect(a).toBe(b);
  });

  it('produces different key for different sizes', () => {
    const a = cartLineKey({ productId: 'abc', selectedColor: 'Soft Yellow', selectedSize: 'M' });
    const b = cartLineKey({ productId: 'abc', selectedColor: 'Soft Yellow', selectedSize: 'L' });
    expect(a).not.toBe(b);
  });

  it('produces different key for different colors', () => {
    const a = cartLineKey({ productId: 'abc', selectedColor: 'Black', selectedSize: 'L' });
    const b = cartLineKey({ productId: 'abc', selectedColor: 'Soft Yellow', selectedSize: 'L' });
    expect(a).not.toBe(b);
  });

  it('produces same key when no color or size (backward compat)', () => {
    const a = cartLineKey({ productId: 'abc' });
    const b = cartLineKey({ productId: 'abc' });
    expect(a).toBe(b);
  });
});
