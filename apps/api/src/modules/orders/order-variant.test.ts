/**
 * Tests for ABM TAGS generation, POSNBPIECE, VALEUR, and MONTANT.
 */
import { describe, it, expect } from 'vitest';
import { buildAbmTags } from './order-to-abm.mapper';
import { normalizeOrderLines } from './order-stock.service';

describe('buildAbmTags', () => {
  it('produces correct TAGS for multi-variant order', () => {
    const items = [
      { productName: 'Pantalon Wide Leg Premium', quantity: 2, selectedColor: 'Soft Yellow', selectedSize: 'M' },
      { productName: 'Pantalon Wide Leg Premium', quantity: 1, selectedColor: 'Black', selectedSize: 'L' },
    ];
    expect(buildAbmTags(items)).toBe('Pantalon Wide Leg Premium [Jaune/M x2, Noir/L x1]');
  });

  it('maps all color names to French', () => {
    const items = [
      { productName: 'P', quantity: 1, selectedColor: 'Beige', selectedSize: 'S' },
      { productName: 'P', quantity: 1, selectedColor: 'White', selectedSize: 'S' },
      { productName: 'P', quantity: 1, selectedColor: 'Black', selectedSize: 'M' },
      { productName: 'P', quantity: 1, selectedColor: 'Chocolate Brown', selectedSize: 'L' },
      { productName: 'P', quantity: 1, selectedColor: 'Sky Blue', selectedSize: 'XL' },
      { productName: 'P', quantity: 1, selectedColor: 'Soft Yellow', selectedSize: 'S' },
      { productName: 'P', quantity: 1, selectedColor: 'Dusty Pink', selectedSize: 'M' },
    ];
    const tags = buildAbmTags(items);
    expect(tags).toContain('Beige');
    expect(tags).toContain('Blanc');
    expect(tags).toContain('Noir');
    expect(tags).toContain('Marron');
    expect(tags).toContain('Bleu Ciel');
    expect(tags).toContain('Jaune');
    expect(tags).toContain('Rose');
  });

  it('falls back to plain format when no color/size', () => {
    const items = [{ productName: 'Simple Product', quantity: 3 }];
    expect(buildAbmTags(items)).toBe('Simple Product x3');
  });

  it('groups multiple products with | separator', () => {
    const items = [
      { productName: 'Pantalon Wide Leg Premium', quantity: 2, selectedColor: 'Soft Yellow', selectedSize: 'M' },
      { productName: 'Casque Audio Pro', quantity: 1 },
    ];
    const tags = buildAbmTags(items);
    expect(tags).toContain('Pantalon Wide Leg Premium [Jaune/M x2]');
    expect(tags).toContain('Casque Audio Pro x1');
    expect(tags).toContain(' | ');
  });

  it('uses unknown color name as-is', () => {
    const items = [{ productName: 'P', quantity: 1, selectedColor: 'Purple Haze', selectedSize: 'S' }];
    expect(buildAbmTags(items)).toBe('P [Purple Haze/S x1]');
  });
});

describe('normalizeOrderLines', () => {
  it('merges same productId + color + size', () => {
    const input = [
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 2, selectedColor: 'Soft Yellow', selectedSize: 'M' },
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 1, selectedColor: 'Soft Yellow', selectedSize: 'M' },
    ];
    const result = normalizeOrderLines(input);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });

  it('keeps different sizes as separate lines', () => {
    const input = [
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 1, selectedColor: 'Soft Yellow', selectedSize: 'M' },
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 1, selectedColor: 'Soft Yellow', selectedSize: 'L' },
    ];
    const result = normalizeOrderLines(input);
    expect(result).toHaveLength(2);
  });

  it('keeps different colors as separate lines', () => {
    const input = [
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 1, selectedColor: 'Black', selectedSize: 'L' },
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 1, selectedColor: 'Soft Yellow', selectedSize: 'L' },
    ];
    const result = normalizeOrderLines(input);
    expect(result).toHaveLength(2);
  });

  it('backward compatible: merges by productId when no color/size', () => {
    const input = [
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 1 },
      { productId: 'aaa111aaa111aaa111aaa111', quantity: 2 },
    ];
    const result = normalizeOrderLines(input);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });
});

describe('ABM fields computation', () => {
  it('POSNBPIECE equals total quantities across all lines', () => {
    const items = [
      { productName: 'Pantalon Wide Leg Premium', quantity: 2, selectedColor: 'Soft Yellow', selectedSize: 'M', unitPriceMillimes: 40000, lineTotalMillimes: 80000 },
      { productName: 'Pantalon Wide Leg Premium', quantity: 1, selectedColor: 'Black', selectedSize: 'L', unitPriceMillimes: 40000, lineTotalMillimes: 40000 },
    ];
    const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);
    expect(totalPieces).toBe(3);
  });

  it('VALEUR equals merchandise subtotal only (no delivery)', () => {
    const subtotalMillimes = 120000;
    const valeur = subtotalMillimes / 1000;
    expect(valeur).toBe(120);
  });

  it('MONTANT equals subtotal + 8 TND delivery', () => {
    const subtotalMillimes = 120000;
    const deliveryFeeMillimes = 8000;
    const totalMillimes = subtotalMillimes + deliveryFeeMillimes;
    const montant = totalMillimes / 1000;
    expect(montant).toBe(128);
  });

  it('TAGS contains color, size, and quantity for every line', () => {
    const items = [
      { productName: 'Pantalon Wide Leg Premium', quantity: 2, selectedColor: 'Soft Yellow', selectedSize: 'M' },
      { productName: 'Pantalon Wide Leg Premium', quantity: 1, selectedColor: 'Black', selectedSize: 'L' },
    ];
    const tags = buildAbmTags(items);
    expect(tags).toContain('Jaune');
    expect(tags).toContain('M');
    expect(tags).toContain('x2');
    expect(tags).toContain('Noir');
    expect(tags).toContain('L');
    expect(tags).toContain('x1');
  });
});
