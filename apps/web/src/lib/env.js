import { z } from 'zod';
const envSchema = z.object({
    VITE_API_BASE_URL: z.url().optional(),
});
const parsedEnv = envSchema.parse(import.meta.env);
export const webEnv = {
    VITE_API_BASE_URL: parsedEnv.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
};
