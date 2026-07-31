import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URLSearchParams } from 'node:url';

import * as cheerio from 'cheerio';
import {
  abmLocationOptionSchema,
  abmPositionFormOptionsSchema,
  abmPostalCodeResponseSchema,
  createAbmPositionResponseSchema,
  type AbmLocationOption,
  type AbmPositionAddress,
  type AbmPositionFormOptions,
  type CreateAbmPositionRequest,
  type CreateAbmPositionResponse,
} from '@delivery-commerce/shared';

import { logger } from '../../../config/logger';
import { env } from '../../../config/env';
import { createAbmHttpError } from '../abm.errors';
import { getAbmSessionManager } from '../index';

import {
  abmAddressDetailSchema,
  abmCityItemSchema,
  abmGovernorateItemSchema,
  abmLocalityItemSchema,
} from './abm-position.external.schemas';
import {
  ABM_POSITION_FIELD_ORDER,
  mapAddressDetail,
  mapCreatePositionRequestToAbmFieldEntries,
  mapLocationOptions,
  selectPreferredPickupAddress,
} from './abm-position.mapper';

import type { AbmPositionFormPageData } from './abm-position.types';

const POSITION_ADD_PATH = '/cPosition/position_add';
const POSITION_CREATE_PATH = '/cPosition/validate_add?Length=9';
const POSITION_GET_LOCN1_PATH = '/cPosition/getlocn1';
const POSITION_GET_LOCN2_PATH = '/cPosition/getlocn2';
const POSITION_GET_LOCN3_PATH = '/cPosition/getlocn3';
const POSITION_GET_CP_PATH = '/cPosition/getCP';
const POSITION_GET_PICKUP_ADDRESS_DETAIL_PATH = '/cPosition/get_details_adrENL';
const POSITION_GET_DELIVERY_ADDRESS_DETAIL_PATH = '/cPosition/get_details_adrliv';
const diagnosticsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../../.logs');
const createPositionDiagnosticsPath = resolve(diagnosticsDirectory, 'abm-position-create-diagnostic.json');
const ABM_POSITION_REFERER_PATH = '/cPosition/position_add';
const REQUIRED_ABM_POSITION_FIELDS = new Set<string>(ABM_POSITION_FIELD_ORDER);

const extractOptions = ($: cheerio.CheerioAPI, selector: string) =>
  $(selector)
    .find('option')
    .map((_, element) => {
      const option = $(element);
      const id = option.attr('value')?.trim() ?? '';
      const label = option.text().trim();

      if (!id || !label) {
        return null;
      }

      return {
        id,
        label,
        selected: option.is('[selected]'),
      };
    })
    .get()
    .filter((value): value is { id: string; label: string; selected: boolean } => value !== null);

const findSelectedOption = (options: Array<{ id: string; selected: boolean }>): string | undefined =>
  options.find((option) => option.selected)?.id;

const getInputValue = ($: cheerio.CheerioAPI, selector: string, fallback = ''): string =>
  $(selector).attr('value')?.trim() ?? fallback;

const parsePositionFormPage = (html: string): AbmPositionFormPageData => {
  const $ = cheerio.load(html);
  const csrfToken = $('input[name="__RequestVerificationToken"]').attr('value')?.trim();

  if (!csrfToken) {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  const pickupAddressBook = extractOptions($, '#select_enl');
  const deliveryAddressBook = extractOptions($, '#select_liv');
  const governorates = extractOptions($, '#LOCN1').map((option) => ({
    id: option.id,
    label: option.label,
  }));
  const serviceOptions = extractOptions($, 'select[name="SERVICEID"]');
  const paymentModeOptions = extractOptions($, 'select[name="POS_MR_CHOIX"]');
  const packagingOptions = extractOptions($, 'select[name="MODCOLISID"]');
  const merchandiseTypeOptions = extractOptions($, 'select[name="TYPEMARCHANDISE"]');
  const preferredPickupAddressId = selectPreferredPickupAddress(pickupAddressBook);

  const formOptions = abmPositionFormOptionsSchema.parse({
    pickupAddressBook,
    deliveryAddressBook,
    governorates,
    serviceOptions,
    paymentModeOptions,
    packagingOptions,
    merchandiseTypeOptions,
    defaults: {
      packagingId: findSelectedOption(packagingOptions) ?? packagingOptions[0]?.id ?? '',
      merchandiseTypeId: findSelectedOption(merchandiseTypeOptions) ?? merchandiseTypeOptions[0]?.id ?? '',
      length: getInputValue($, 'input[name="LONGEUR"]', '1'),
      height: getInputValue($, 'input[name="HAUTEUR"]', '1'),
      width: getInputValue($, 'input[name="LARGEUR"]', '1'),
      volume: getInputValue($, 'input[name="VOLUME"]', '1'),
      pickupTime: getInputValue($, 'input[name="HEURENL"]', '14:00'),
    },
    ...(preferredPickupAddressId ? { preferredPickupAddressId } : {}),
  });

  return preferredPickupAddressId
    ? {
        ...formOptions,
        preferredPickupAddressId,
        csrfToken,
      }
    : {
        ...formOptions,
        csrfToken,
      };
};

const parseJson = (payload: string): unknown => {
  try {
    return JSON.parse(payload);
  } catch {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }
};

const normalizeAbmPlainValue = (value: string): string =>
  value
    .trim()
    .replace(/^"+/u, '')
    .replace(/"+$/u, '')
    .trim();

const extractPositionId = (payload: string): string | null => {
  const match = payload.match(/^success__\s*([A-Za-z0-9_-]+)$/u) ?? payload.match(/success__\s*([A-Za-z0-9_-]+)/u);
  return match?.[1]?.trim() || null;
};

const classifyCreateResponse = (payload: string) => ({
  length: payload.length,
  looksLikeHtml: /<html|<body|<form/i.test(payload),
  containsSuccessMarker: /success__/i.test(payload),
  containsCodInvalid: /COD_INVALIDE/i.test(payload),
});

const normalizeSnippet = (value: string): string =>
  value.replace(/\s+/gu, ' ').trim();

const uniqueNonEmpty = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = normalizeSnippet(value);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
};

const extractCreateResponseDiagnostics = (payload: string) => {
  if (!/<html|<body|<form/i.test(payload)) {
    return {
      html: false,
    };
  }

  const $ = cheerio.load(payload);
  const title = normalizeSnippet($('title').first().text());
  const headings = uniqueNonEmpty(
    $('h1, h2, h3, .page-title, .panel-title, .title, .modal-title')
      .map((_, element) => $(element).text())
      .get(),
  ).slice(0, 5);
  const validationMessages = uniqueNonEmpty(
    $(
      '.validation-summary-errors li, .validation-summary-errors, .field-validation-error, .field-validation-valid, .text-danger, .alert-danger, .alert, .error, .errors li, .errors',
    )
      .map((_, element) => $(element).text())
      .get(),
  )
    .filter((message) => message.length <= 240)
    .slice(0, 10);
  const bodyHints = uniqueNonEmpty(
    $('body')
      .text()
      .split(/[\r\n]+/u)
      .map((line) => normalizeSnippet(line))
      .filter((line) =>
        /erreur|error|obligatoire|required|invalide|invalid|montant|date|heure|adresse|telephone|mobile|ville|gouvernorat|localite|code postal|service|paiement/iu.test(
          line,
        ),
      ),
  )
    .filter((line) => line.length <= 240)
    .slice(0, 10);

  return {
    html: true,
    ...(title ? { title } : {}),
    ...(headings.length > 0 ? { headings } : {}),
    ...(validationMessages.length > 0 ? { validationMessages } : {}),
    ...(bodyHints.length > 0 ? { bodyHints } : {}),
  };
};

const redactEncodedBody = (serializedBody: string): string =>
  serializedBody
    .split('&')
    .map((pair) => {
      const [rawKey = ''] = pair.split('=');
      const key = decodeURIComponent(rawKey);
      return `${key}=${key === '__RequestVerificationToken' ? '<redacted>' : '<present>'}`;
    })
    .join('&');

const detectDuplicateFieldNames = (entries: ReadonlyArray<readonly [string, string]>): string[] => {
  const counts = new Map<string, number>();

  for (const [fieldName] of entries) {
    counts.set(fieldName, (counts.get(fieldName) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([fieldName]) => fieldName);
};

const buildPositionRequestBody = (entries: ReadonlyArray<readonly [string, string]>) => {
  const params = new URLSearchParams();

  for (const [fieldName, fieldValue] of entries) {
    params.append(fieldName, fieldValue);
  }

  return params.toString();
};

const hasValueWhitespace = (value: string): boolean => value !== value.trim();

const createPositionRequestDiagnostic = async ({
  serializedBody,
  entries,
  tokenPresent,
}: {
  serializedBody: string;
  entries: ReadonlyArray<readonly [string, string]>;
  tokenPresent: boolean;
}) => {
  const cookieDiagnostics = await getAbmSessionManager().getCookieDiagnostics();
  const orderedFieldNames = entries.map(([fieldName]) => fieldName);
  const missingFields = ABM_POSITION_FIELD_ORDER.filter((fieldName) => !orderedFieldNames.includes(fieldName));
  const extraFields = orderedFieldNames.filter((fieldName) => !REQUIRED_ABM_POSITION_FIELDS.has(fieldName));
  const duplicateFields = detectDuplicateFieldNames(entries);
  const emptyRequiredFields = entries
    .filter(([fieldName, fieldValue]) => REQUIRED_ABM_POSITION_FIELDS.has(fieldName) && fieldValue === '')
    .map(([fieldName]) => fieldName)
    .filter((fieldName) => !['CONTACTPRENOM', 'ADR2', 'ADRFAX', 'ADRMAIL', 'ADR2LIV', 'CONTACTPRENOMLIV', 'ADRTELLIV', 'POSREFERENCE', 'VALEUR', 'RTRNCONTENU'].includes(fieldName));
  const whitespaceFieldNames = orderedFieldNames.filter((fieldName) => fieldName !== fieldName.trim());
  const whitespaceValues = entries.filter(([, fieldValue]) => hasValueWhitespace(fieldValue)).map(([fieldName]) => fieldName);

  return {
    url: POSITION_CREATE_PATH,
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    fieldCount: orderedFieldNames.length,
    orderedFieldNames,
    missingFields,
    extraFields,
    duplicateFields,
    emptyRequiredFields,
    whitespaceFieldNames,
    whitespaceValues,
    requestTokenPresent: tokenPresent,
    applicationCookiePresent: cookieDiagnostics.applicationCookiePresent,
    antiforgeryCookiePresent: cookieDiagnostics.antiforgeryCookiePresent,
    cookieCount: cookieDiagnostics.cookieCount,
    bodyByteLength: Buffer.byteLength(serializedBody, 'utf8'),
    redactedEncodedBody: redactEncodedBody(serializedBody),
  };
};

const classifyCreateHttpResponse = ({
  status,
  headers,
  payload,
  finalUrl,
}: {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  payload: string;
  finalUrl: string;
}) => {
  const text = String(payload ?? '').trim();
  const contentType = String(headers['content-type'] ?? '').toLowerCase();
  const locationHeader = headers.location;
  const looksLikeLoginHtml = /<input[^>]+name=["']UserName["']/iu.test(text);
  const looksLikeServer500 = status >= 500 || /internal server error/iu.test(text);

  let category:
    | 'success_text'
    | 'cod_invalid'
    | 'redirect'
    | 'login_html'
    | 'server_500_html'
    | 'unknown_text'
    | 'empty' = 'unknown_text';

  if (!text) {
    category = 'empty';
  } else if (/^success__(.+)$/u.test(text) || /success__\s*[A-Za-z0-9_-]+/u.test(text)) {
    category = 'success_text';
  } else if (text === 'COD_INVALIDE') {
    category = 'cod_invalid';
  } else if (status >= 300 && status < 400) {
    category = 'redirect';
  } else if (looksLikeLoginHtml) {
    category = 'login_html';
  } else if (looksLikeServer500) {
    category = 'server_500_html';
  }

  return {
    firstStatus: status,
    locationPresent: Boolean(locationHeader),
    contentType,
    finalUrl,
    category,
  };
};

const writeCreateResponseDiagnostics = (details: {
  response: ReturnType<typeof classifyCreateResponse>;
  diagnostics: ReturnType<typeof extractCreateResponseDiagnostics>;
  request?: Awaited<ReturnType<typeof createPositionRequestDiagnostic>>;
  responseMeta?: ReturnType<typeof classifyCreateHttpResponse>;
}): void => {
  if (!env.isTest) {
    mkdirSync(diagnosticsDirectory, { recursive: true });
    writeFileSync(createPositionDiagnosticsPath, JSON.stringify(details, null, 2));
  }
};

const requestJsonArray = async (path: string, body: URLSearchParams = new URLSearchParams()): Promise<unknown[]> => {
  const payload = await getAbmSessionManager().postProtectedForm(path, body);
  const parsed = parseJson(payload);

  if (!Array.isArray(parsed)) {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  return parsed;
};

const requestAddressDetail = async (path: string, id: string): Promise<AbmPositionAddress> => {
  const payload = await getAbmSessionManager().postProtectedForm(
    path,
    new URLSearchParams({ id }),
  );
  const parsed = parseJson(payload);
  const detail = abmAddressDetailSchema.parse(parsed);
  return mapAddressDetail(id, detail);
};

export const getPositionFormOptions = async (): Promise<AbmPositionFormOptions> => {
  const html = await getAbmSessionManager().getProtectedText(POSITION_ADD_PATH);
  const formPage = parsePositionFormPage(html);

  return abmPositionFormOptionsSchema.parse({
    pickupAddressBook: formPage.pickupAddressBook,
    deliveryAddressBook: formPage.deliveryAddressBook,
    governorates: formPage.governorates,
    serviceOptions: formPage.serviceOptions,
    paymentModeOptions: formPage.paymentModeOptions,
    packagingOptions: formPage.packagingOptions,
    merchandiseTypeOptions: formPage.merchandiseTypeOptions,
    defaults: formPage.defaults,
    ...(formPage.preferredPickupAddressId ? { preferredPickupAddressId: formPage.preferredPickupAddressId } : {}),
  });
};

export const getPickupAddressBook = async () => {
  const html = await getAbmSessionManager().getProtectedText(POSITION_ADD_PATH);
  return parsePositionFormPage(html).pickupAddressBook;
};

export const getDeliveryAddressBook = async () => {
  const html = await getAbmSessionManager().getProtectedText(POSITION_ADD_PATH);
  return parsePositionFormPage(html).deliveryAddressBook;
};

export const getGovernorates = async (): Promise<AbmLocationOption[]> => {
  const parsed = await requestJsonArray(POSITION_GET_LOCN1_PATH);
  const items = parsed.map((item) => abmGovernorateItemSchema.parse(item));
  return abmLocationOptionSchema.array().parse(
    mapLocationOptions(items.map((item) => ({ id: item.IDN1, label: item.LIBELLEN1 }))),
  );
};

export const getCities = async (governorateId: string): Promise<AbmLocationOption[]> => {
  const parsed = await requestJsonArray(
    POSITION_GET_LOCN2_PATH,
    new URLSearchParams({ idn1: governorateId }),
  );
  const items = parsed.map((item) => abmCityItemSchema.parse(item));
  return abmLocationOptionSchema.array().parse(
    mapLocationOptions(items.map((item) => ({ id: item.IDN2, label: item.LIBELLEN2 }))),
  );
};

export const getLocalities = async (cityId: string): Promise<AbmLocationOption[]> => {
  const parsed = await requestJsonArray(
    POSITION_GET_LOCN3_PATH,
    new URLSearchParams({ idn2: cityId }),
  );
  const items = parsed.map((item) => abmLocalityItemSchema.parse(item));
  return abmLocationOptionSchema.array().parse(
    mapLocationOptions(items.map((item) => ({ id: item.IDN3, label: item.LIBELLEN3 }))),
  );
};

export const getPostalCode = async (localityId: string) => {
  const payload = await getAbmSessionManager().postProtectedForm(
    POSITION_GET_CP_PATH,
    new URLSearchParams({ idn3: localityId }),
  );

  return abmPostalCodeResponseSchema.parse({
    postalCode: normalizeAbmPlainValue(payload),
  });
};

export const getPickupAddressDetail = async (id: string) =>
  requestAddressDetail(POSITION_GET_PICKUP_ADDRESS_DETAIL_PATH, id);

export const getDeliveryAddressDetail = async (id: string) =>
  requestAddressDetail(POSITION_GET_DELIVERY_ADDRESS_DETAIL_PATH, id);

export const createAbmPosition = async (
  payload: CreateAbmPositionRequest,
): Promise<CreateAbmPositionResponse> => {
  const html = await getAbmSessionManager().getProtectedText(POSITION_ADD_PATH);
  const formPage = parsePositionFormPage(html);
  const entries = mapCreatePositionRequestToAbmFieldEntries({ formPage, payload });
  const serializedBody = buildPositionRequestBody(entries);
  const requestDiagnostic = await createPositionRequestDiagnostic({
    serializedBody,
    entries,
    tokenPresent: Boolean(formPage.csrfToken),
  });
  const response = await getAbmSessionManager().postProtectedFormDetailed(
    POSITION_CREATE_PATH,
    serializedBody,
    {
      maxRedirects: 0,
      headers: {
        Accept: '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${env.ABM_BASE_URL}${ABM_POSITION_REFERER_PATH}`,
        Origin: env.ABM_BASE_URL,
      },
    },
  );
  const normalized = response.data.trim();
  const responseMeta = classifyCreateHttpResponse({
    status: response.status,
    headers: response.headers,
    payload: response.data,
    finalUrl: response.finalUrl,
  });

  if (responseMeta.category === 'cod_invalid') {
    throw createAbmHttpError('ABM_INVALID_COD_AMOUNT');
  }

  const positionId = extractPositionId(normalized);
  const diagnosticDetails = {
    response: classifyCreateResponse(normalized),
    diagnostics: extractCreateResponseDiagnostics(normalized),
    request: requestDiagnostic,
    responseMeta,
  };

  writeCreateResponseDiagnostics(diagnosticDetails);

  if (responseMeta.category === 'success_text' && positionId) {
    return createAbmPositionResponseSchema.parse({
      position: { id: positionId.trim() },
      message: 'Position creee avec succes.',
    });
  }

  logger.warn(diagnosticDetails, 'ABM position creation returned an unexpected response');

  if (responseMeta.category === 'login_html' || responseMeta.category === 'redirect') {
    throw createAbmHttpError('ABM_SESSION_EXPIRED');
  }

  if (responseMeta.category === 'server_500_html') {
    throw createAbmHttpError('ABM_SERVER_ERROR');
  }

  if (responseMeta.category === 'empty' || responseMeta.category === 'unknown_text') {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  throw createAbmHttpError('ABM_POSITION_CREATION_FAILED');
};
