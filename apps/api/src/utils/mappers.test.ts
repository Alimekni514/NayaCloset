import { describe, it, expect } from 'vitest';
import { toProductDto } from './mappers';

describe('toProductDto', () => {
  it('maps sizes correctly', () => {
    const product = {
      _id: '123',
      name: 'Test',
      slug: 'test',
      priceCents: 1000,
      inventory: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sizes: ['S', 'M'],
      colorVariants: [
        {
          color: 'Blue',
          imageUrl: 'url1',
          availableSizes: ['S']
        }
      ]
    };
    const dto = toProductDto(product);
    expect(dto.sizes).toEqual(['S', 'M']);
    expect(dto.colorVariants![0].availableSizes).toEqual(['S']);
  });
});
