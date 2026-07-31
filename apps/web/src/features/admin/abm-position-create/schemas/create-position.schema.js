import { z } from 'zod';
const todayIso = () => new Date().toISOString().slice(0, 10);
const optionalText = z.string().trim().optional().or(z.literal(''));
const addressSchema = z.object({
    addressBookId: optionalText,
    contactLastName: z.string().trim().min(1, 'Champ obligatoire'),
    contactFirstName: optionalText,
    addressLine1: z.string().trim().min(1, 'Champ obligatoire'),
    addressLine2: optionalText,
    governorateId: z.string().trim().min(1, 'Champ obligatoire'),
    governorateName: optionalText,
    cityId: z.string().trim().min(1, 'Champ obligatoire'),
    cityName: optionalText,
    localityId: z.string().trim().min(1, 'Champ obligatoire'),
    localityName: optionalText,
    postalCode: z.string().trim().min(1, 'Champ obligatoire'),
    mobile: z.string().trim().min(1, 'Champ obligatoire'),
    phone: optionalText,
    fax: optionalText,
    email: z.union([z.string().trim().email('Email invalide'), z.literal('')]).optional(),
});
export const createPositionFormSchema = z
    .object({
    pickup: addressSchema,
    delivery: addressSchema.extend({
        fax: optionalText,
        email: optionalText,
    }),
    parcel: z.object({
        pickupDate: z
            .string()
            .trim()
            .min(1, 'Champ obligatoire')
            .refine((value) => value >= todayIso(), 'La date doit etre aujourd hui ou plus tard.'),
        pickupTime: z.string().trim().min(1, 'Champ obligatoire'),
        weight: z.coerce.number().positive('Le poids doit etre superieur a 0.'),
        pieces: z.coerce.number().int('Nombre entier requis').positive('Minimum 1'),
        reference: optionalText,
        declaredValue: z.coerce.number().min(0, 'La valeur doit etre positive ou nulle.'),
        contents: z.array(z.string().trim().min(1)).default([]),
    }),
    service: z
        .object({
        serviceId: z.string().trim().min(1, 'Champ obligatoire'),
        codAmount: z.coerce.number().min(0, 'Le montant doit etre positif ou nul.'),
        paymentModeId: z.string().trim().min(1, 'Champ obligatoire'),
        exchange: z.boolean().default(false),
        exchangeContents: optionalText,
        allowOpen: z.boolean().default(false),
    })
        .superRefine((value, ctx) => {
        if (value.exchange && !value.exchangeContents?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['exchangeContents'],
                message: 'Precisez le contenu a recuperer.',
            });
        }
    }),
})
    .transform((value) => ({
    ...value,
    pickup: {
        ...value.pickup,
        email: value.pickup.email ?? '',
    },
    delivery: {
        ...value.delivery,
        fax: '',
        email: '',
    },
}));
export const stepFieldMap = {
    0: [
        'pickup.addressBookId',
        'pickup.contactLastName',
        'pickup.addressLine1',
        'pickup.governorateId',
        'pickup.cityId',
        'pickup.localityId',
        'pickup.postalCode',
        'pickup.mobile',
    ],
    1: [
        'delivery.addressBookId',
        'delivery.contactLastName',
        'delivery.addressLine1',
        'delivery.governorateId',
        'delivery.cityId',
        'delivery.localityId',
        'delivery.postalCode',
        'delivery.mobile',
    ],
    2: [
        'parcel.pickupDate',
        'parcel.pickupTime',
        'parcel.weight',
        'parcel.pieces',
        'parcel.declaredValue',
    ],
    3: [
        'service.serviceId',
        'service.codAmount',
        'service.paymentModeId',
        'service.exchangeContents',
        'service.allowOpen',
    ],
};
