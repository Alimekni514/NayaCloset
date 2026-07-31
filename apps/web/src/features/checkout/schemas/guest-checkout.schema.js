import { z } from 'zod';
export const guestCheckoutSchema = z.object({
    contactLastName: z.string().trim().min(2, 'Champ obligatoire').max(80, 'Valeur trop longue'),
    contactFirstName: z.string().trim().max(80, 'Valeur trop longue').optional().or(z.literal('')),
    addressLine1: z.string().trim().min(3, 'Champ obligatoire').max(160, 'Valeur trop longue'),
    addressLine2: z.string().trim().max(160, 'Valeur trop longue').optional().or(z.literal('')),
    governorateId: z.string().min(1, 'Champ obligatoire'),
    cityId: z.string().min(1, 'Champ obligatoire'),
    localityId: z.string().min(1, 'Champ obligatoire'),
    postalCode: z
        .string()
        .trim()
        .transform((value) => value.replace(/[^\d]/gu, '').slice(0, 4))
        .refine((value) => /^\d{4}$/u.test(value), 'Le code postal doit contenir 4 chiffres.'),
    mobile: z
        .string()
        .trim()
        .transform((value) => value.replace(/[^\d]/gu, ''))
        .refine((value) => /^\d{8}$/u.test(value), 'Le numero mobile doit contenir 8 chiffres.'),
    phone: z
        .string()
        .trim()
        .transform((value) => value.replace(/[^\d]/gu, ''))
        .refine((value) => value === '' || /^\d{8}$/u.test(value), 'Le numero de telephone doit contenir 8 chiffres.')
        .optional()
        .or(z.literal('')),
});
