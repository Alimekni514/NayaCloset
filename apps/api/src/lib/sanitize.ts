import mongoSanitize from 'mongo-sanitize';

export const sanitizePayload = <T>(payload: T): T => mongoSanitize(payload);
