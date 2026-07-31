import { z } from 'zod';

const optionalString = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => (value == null ? '' : String(value).trim()));

const optionalNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  });

export const abmExternalPositionListItemSchema = z
  .object({
    POSID: optionalString,
    POSBARCODE: optionalString,
    POSREFERENCE: optionalString,
    DATECREATE: optionalString,
    POSDATEENL: optionalString,
    POSDATELIV: optionalString,
    DATEUPD: optionalString,
    ENL_LIBELLEN1: optionalString,
    ENL_LIBELLEN2: optionalString,
    ENL_LIBELLEN3: optionalString,
    LIV_LIBELLEN1: optionalString,
    LIV_LIBELLEN2: optionalString,
    LIV_LIBELLEN3: optionalString,
    LIV_CODEP: optionalString,
    LIV_ADR1: optionalString,
    LIV_ADR2: optionalString,
    LIV_ADPCONTACTNOM: optionalString,
    LIV_ADPCONTACTPRENOM: optionalString,
    LIV_ADPPORTABLE: optionalString,
    LIV_EMAIL: optionalString,
    SERVICEINTITULE: optionalString,
    COLMNTCOD: optionalNumber,
    EVENTID: z.coerce.number().int().catch(0),
    STATLIBELLE: optionalString,
    POSTENTATIVELIV: z.coerce.number().int().catch(0),
    POSNBPIECE: z.coerce.number().int().catch(0),
  })
  .partial()
  .passthrough();

export const abmExternalPositionListSchema = z.array(abmExternalPositionListItemSchema);

export type AbmExternalPositionListItem = z.infer<typeof abmExternalPositionListItemSchema>;
