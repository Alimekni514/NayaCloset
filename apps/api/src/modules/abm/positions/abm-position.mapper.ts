import type {
  AbmLocationOption,
  AbmPositionAddress,
  AbmSelectOption,
  CreateAbmPositionRequest,
} from '@delivery-commerce/shared';

import type { abmAddressDetailSchema } from './abm-position.external.schemas';
import type { AbmPositionFormPageData } from './abm-position.types';

type ParsedAddressDetail = typeof abmAddressDetailSchema._output;
type AbmFieldEntry = readonly [string, string];

const clean = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const pickFirst = (...values: Array<string | undefined>): string | undefined =>
  values.map(clean).find(Boolean);

export const selectPreferredPickupAddress = (options: AbmSelectOption[]): string | undefined => {
  const nayaStore = options.find((option) => option.label.toLowerCase().includes('naya store'));

  if (nayaStore) {
    return nayaStore.id;
  }

  if (options.length === 1) {
    return options[0]?.id;
  }

  return undefined;
};

export const mapAddressDetail = (
  id: string | undefined,
  detail: ParsedAddressDetail,
): AbmPositionAddress => ({
  ...(id ? { id } : {}),
  contactLastName: clean(detail.CONTACTNOM) ?? '',
  ...(clean(detail.CONTACTPRENOM) ? { contactFirstName: clean(detail.CONTACTPRENOM) } : {}),
  addressLine1: clean(detail.ADR1) ?? '',
  ...(clean(detail.ADR2) ? { addressLine2: clean(detail.ADR2) } : {}),
  governorateId: pickFirst(detail.ELOCN1, detail.LOCN1, detail.IDN1) ?? '',
  ...(pickFirst(detail.LIBELLEN1, detail.ADRSTATE) ? { governorateName: pickFirst(detail.LIBELLEN1, detail.ADRSTATE) } : {}),
  cityId: pickFirst(detail.ELOCN2, detail.LOCN2, detail.IDN2) ?? '',
  ...(pickFirst(detail.LIBELLEN2, detail.ADRVILLE) ? { cityName: pickFirst(detail.LIBELLEN2, detail.ADRVILLE) } : {}),
  localityId: pickFirst(detail.ELOCN3, detail.LOCN3, detail.IDN3) ?? '',
  ...(clean(detail.LIBELLEN3) ? { localityName: clean(detail.LIBELLEN3) } : {}),
  postalCode: clean(detail.CODEPOSTAL) ?? '',
  mobile: clean(detail.ADRPORTABLE) ?? '',
  ...(clean(detail.ADRTEL) ? { phone: clean(detail.ADRTEL) } : {}),
  ...(clean(detail.ADRFAX) ? { fax: clean(detail.ADRFAX) } : {}),
  ...(clean(detail.ADRMAIL) ? { email: clean(detail.ADRMAIL) } : {}),
});

export const mapLocationOptions = (
  items: Array<{ id: string; label: string }>,
): AbmLocationOption[] => items.map((item) => ({ id: item.id, label: item.label }));

const booleanToAbm = (value: boolean): string => (value ? '1' : '0');

const serializeTags = (tags: string[]): string =>
  tags.map((tag) => tag.trim()).filter(Boolean).join(',');

const toFieldString = (value: string | number | boolean | null | undefined): string => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  return booleanToAbm(value);
};

export const ABM_POSITION_FIELD_ORDER = [
  '__RequestVerificationToken',
  'CONTACTNOM',
  'CONTACTPRENOM',
  'ADR1',
  'ADR2',
  'ELOCN1',
  'ELOCN2',
  'ELOCN3',
  'CODEPOSTAL',
  'ADRPORTABLE',
  'ADRTEL',
  'ADRFAX',
  'ADRMAIL',
  'LOCN1LIV',
  'LOCN2LIV',
  'LOCN3LIV',
  'ADRCODEPOSTALLIV',
  'ADR1LIV',
  'ADR2LIV',
  'CONTACTNOMLIV',
  'CONTACTPRENOMLIV',
  'ADRPORTABLELIV',
  'ADRTELLIV',
  'POSITION_TIME_LIV_DISPO_FROM',
  'POSITION_TIME_LIV_DISPO_TO',
  'DATEENL',
  'HEURENL',
  'MODCOLISID',
  'TYPEMARCHANDISE',
  'LONGEUR',
  'HAUTEUR',
  'LARGEUR',
  'VOLUME',
  'POIDS',
  'POSNBPIECE',
  'POSREFERENCE',
  'VALEUR',
  'TAGS',
  'SERVICEID',
  'MONTANT',
  'POS_MR_CHOIX',
  'RTRN',
  'RTRNCONTENU',
  'POS_ALLOW_OPEN',
] as const;

export type AbmPositionFieldName = (typeof ABM_POSITION_FIELD_ORDER)[number];

export const mapCreatePositionRequestToAbmFieldEntries = ({
  formPage,
  payload,
}: {
  formPage: AbmPositionFormPageData;
  payload: CreateAbmPositionRequest;
}): AbmFieldEntry[] => {
  const fieldMap: Record<AbmPositionFieldName, string> = {
    __RequestVerificationToken: toFieldString(formPage.csrfToken),
    CONTACTNOM: toFieldString(payload.pickup.contactLastName),
    CONTACTPRENOM: toFieldString(payload.pickup.contactFirstName),
    ADR1: toFieldString(payload.pickup.addressLine1),
    ADR2: toFieldString(payload.pickup.addressLine2),
    ELOCN1: toFieldString(payload.pickup.governorateId),
    ELOCN2: toFieldString(payload.pickup.cityId),
    ELOCN3: toFieldString(payload.pickup.localityId),
    CODEPOSTAL: toFieldString(payload.pickup.postalCode),
    ADRPORTABLE: toFieldString(payload.pickup.mobile),
    ADRTEL: toFieldString(payload.pickup.phone),
    ADRFAX: toFieldString(payload.pickup.fax),
    ADRMAIL: toFieldString(payload.pickup.email),
    LOCN1LIV: toFieldString(payload.delivery.governorateId),
    LOCN2LIV: toFieldString(payload.delivery.cityId),
    LOCN3LIV: toFieldString(payload.delivery.localityId),
    ADRCODEPOSTALLIV: toFieldString(payload.delivery.postalCode),
    ADR1LIV: toFieldString(payload.delivery.addressLine1),
    ADR2LIV: toFieldString(payload.delivery.addressLine2),
    CONTACTNOMLIV: toFieldString(payload.delivery.contactLastName),
    CONTACTPRENOMLIV: toFieldString(payload.delivery.contactFirstName),
    ADRPORTABLELIV: toFieldString(payload.delivery.mobile),
    ADRTELLIV: toFieldString(payload.delivery.phone),
    POSITION_TIME_LIV_DISPO_FROM: '10:00',
    POSITION_TIME_LIV_DISPO_TO: '14:00',
    DATEENL: toFieldString(payload.parcel.pickupDate),
    HEURENL: toFieldString(payload.parcel.pickupTime),
    MODCOLISID: toFieldString(formPage.defaults.packagingId),
    TYPEMARCHANDISE: toFieldString(formPage.defaults.merchandiseTypeId),
    LONGEUR: toFieldString(formPage.defaults.length),
    HAUTEUR: toFieldString(formPage.defaults.height),
    LARGEUR: toFieldString(formPage.defaults.width),
    VOLUME: toFieldString(formPage.defaults.volume),
    POIDS: toFieldString(payload.parcel.weight),
    POSNBPIECE: toFieldString(payload.parcel.pieces),
    POSREFERENCE: toFieldString(payload.parcel.reference),
    VALEUR: toFieldString(payload.parcel.declaredValue),
    TAGS: toFieldString(serializeTags(payload.parcel.contents)),
    SERVICEID: toFieldString(payload.service.serviceId),
    MONTANT: toFieldString(payload.service.codAmount),
    POS_MR_CHOIX: toFieldString(payload.service.paymentModeId),
    RTRN: booleanToAbm(payload.service.exchange),
    RTRNCONTENU: toFieldString(payload.service.exchangeContents),
    POS_ALLOW_OPEN: booleanToAbm(payload.service.allowOpen),
  };

  return ABM_POSITION_FIELD_ORDER.map((fieldName) => [fieldName, fieldMap[fieldName]] as const);
};
