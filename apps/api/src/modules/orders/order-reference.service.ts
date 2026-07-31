import { randomBytes } from 'node:crypto';

import { OrderModel } from '../../models/order.model';

import { ORDER_REFERENCE_LENGTH } from './order.constants';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateReferenceCandidate = (): string => {
  const bytes = randomBytes(ORDER_REFERENCE_LENGTH);
  let result = '';

  for (let index = 0; index < ORDER_REFERENCE_LENGTH; index += 1) {
    result += ALPHABET[bytes[index]! % ALPHABET.length];
  }

  return result;
};

export const generateUniqueOrderReference = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateReferenceCandidate();
    const existing = await OrderModel.exists({ reference: candidate });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique order reference');
};
