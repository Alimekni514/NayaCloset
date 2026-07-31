import * as cheerio from 'cheerio';
import {
  mapAbmProgressStage,
  mapAbmStatusCategory,
  type AbmPositionDetail,
  type AbmPositionDetailEvent,
} from '@delivery-commerce/shared';

import { createAbmHttpError } from '../abm.errors';

const normalizeWhitespace = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/gu, ' ').trim();

const parseLocalizedNumber = (value: string | null | undefined): number | null => {
  const normalized = normalizeWhitespace(value).replace(/\s/gu, '').replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value: string | null | undefined): number | null => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/[^\d-]/gu, '');
  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTunisiaDateTime = (value: string | null | undefined): string | null => {
  const normalized = normalizeWhitespace(value);
  const match = normalized.match(
    /^(?<day>\d{2})\/(?<month>\d{2})\/(?<year>\d{4})(?:\s+(?<hour>\d{2}):(?<minute>\d{2})(?::(?<second>\d{2}))?)?$/u,
  );

  if (!match?.groups) {
    return null;
  }

  const day = Number(match.groups.day);
  const month = Number(match.groups.month);
  const year = Number(match.groups.year);
  const hour = Number(match.groups.hour ?? '0');
  const minute = Number(match.groups.minute ?? '0');
  const second = Number(match.groups.second ?? '0');

  const utcTimestamp = Date.UTC(year, month - 1, day, hour - 1, minute, second);
  const date = new Date(utcTimestamp);

  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return date.toISOString();
};

const extractRouteBlock = (
  $: cheerio.CheerioAPI,
  title: 'Départ' | 'Livraison' | 'Etat',
): { label: string; date: string | null } | null => {
  const block = $('ul.list-unstyled.timeline > li')
    .filter((_, element) => normalizeWhitespace($(element).find('.tags .tag span').first().text()) === title)
    .first();

  if (!block.length) {
    return null;
  }

  return {
    label: normalizeWhitespace(block.find('.block_content .title').first().text()),
    date: parseTunisiaDateTime(block.find('.block_content .byline span').first().text()),
  };
};

const extractTableValues = ($: cheerio.CheerioAPI, expectedHeaders: string[]): string[] | null => {
  const table = $('table.table')
    .filter((_, element) => {
      const headers = $(element)
        .find('thead tr')
        .first()
        .find('th, td')
        .map((__, header) => normalizeWhitespace($(header).text()))
        .get();

      return expectedHeaders.every((header, index) => headers[index] === header);
    })
    .first();

  if (!table.length) {
    return null;
  }

  return table
    .find('tbody tr')
    .first()
    .find('td')
    .map((_, cell) => normalizeWhitespace($(cell).text()))
    .get();
};

const buildEventId = (label: string, index: number): string =>
  `event-${index + 1}-${label.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/(^-|-$)/gu, '') || 'unknown'}`;

const findLastMatchingEvent = (
  events: AbmPositionDetailEvent[],
  predicate: (event: AbmPositionDetailEvent) => boolean,
): AbmPositionDetailEvent | undefined => {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event && predicate(event)) {
      return event;
    }
  }

  return undefined;
};

export const parseAbmPositionDetailHtml = (html: string, positionId: string): AbmPositionDetail => {
  if (!normalizeWhitespace(html)) {
    throw createAbmHttpError('ABM_POSITION_DETAIL_PARSE_FAILED');
  }

  const $ = cheerio.load(html);
  const heading = $('h2')
    .filter((_, element) => normalizeWhitespace($(element).text()).includes('Position numéro'))
    .first();

  const headingText = normalizeWhitespace(heading.text());
  const barcodeMatch = headingText.match(/Position numéro\s+(\d{6,})/u);
  const barcode = barcodeMatch?.[1];

  if (!barcode) {
    throw createAbmHttpError('ABM_POSITION_DETAIL_PARSE_FAILED');
  }

  const timelineEvents: AbmPositionDetailEvent[] = $('ul.list-unstyled.timeline.widget > li')
    .map((index, element) => {
      const label = normalizeWhitespace($(element).find('.title').first().text());
      const occurredAt = parseTunisiaDateTime($(element).find('.byline span').first().text());

      if (!label) {
        return null;
      }

      return {
        id: buildEventId(label, index),
        label,
        occurredAt,
        isCurrent: index === 0,
      };
    })
    .get()
    .filter((event): event is AbmPositionDetailEvent => event !== null);

  if (timelineEvents.length === 0) {
    throw createAbmHttpError('ABM_POSITION_DETAIL_PARSE_FAILED');
  }

  const departureBlock = extractRouteBlock($, 'Départ');
  const destinationBlock = extractRouteBlock($, 'Livraison');
  const statusBlock = extractRouteBlock($, 'Etat');

  const firstTable = extractTableValues($, ['Type', 'Poids (kg)', 'Services']);
  const secondTable = extractTableValues($, ['Départ', 'Destination', 'Nombre de pièces']);
  const thirdTable = extractTableValues($, ['Longueur (cm)', 'Largeur (cm)', 'Hauteur (cm)']);

  const currentStatusLabel =
    statusBlock?.label || timelineEvents.find((event) => event.isCurrent)?.label || 'Statut inconnu';
  const statusCategory = mapAbmStatusCategory(currentStatusLabel);

  const detail: AbmPositionDetail = {
    id: positionId,
    barcode,
    status: {
      label: currentStatusLabel,
      category: statusCategory,
    },
    progressStage: mapAbmProgressStage(currentStatusLabel, statusCategory),
    createdAt:
      findLastMatchingEvent(
        timelineEvents,
        (event) => /création étiquette position|creation etiquette position/iu.test(event.label),
      )?.occurredAt ??
      timelineEvents[timelineEvents.length - 1]?.occurredAt ??
      null,
    pickupDate:
      timelineEvents.find((event) => /colis enlev|tentative enlev/iu.test(event.label))?.occurredAt ?? null,
    deliveryDate:
      timelineEvents.find((event) => /colis livré|colis livre|\blivré\b|\blivre\b/iu.test(event.label))?.occurredAt ??
      null,
    updatedAt: timelineEvents[0]?.occurredAt ?? null,
    departure: {
      displayLabel: departureBlock?.label || secondTable?.[0] || 'Non disponible',
    },
    destination: {
      displayLabel: destinationBlock?.label || secondTable?.[1] || 'Non disponible',
    },
    shipment: {
      ...(firstTable?.[0] ? { type: firstTable[0] } : {}),
      ...(firstTable?.[2] ? { service: firstTable[2] } : {}),
      ...(firstTable ? { weightKg: parseLocalizedNumber(firstTable[1]) } : {}),
      ...(secondTable ? { pieces: parseInteger(secondTable[2]) } : {}),
    },
    dimensions: {
      ...(thirdTable ? { lengthCm: parseLocalizedNumber(thirdTable[0]) } : {}),
      ...(thirdTable ? { widthCm: parseLocalizedNumber(thirdTable[1]) } : {}),
      ...(thirdTable ? { heightCm: parseLocalizedNumber(thirdTable[2]) } : {}),
    },
    events: timelineEvents,
    permissions: {
      canEdit: statusCategory === 'created',
      canDelete: statusCategory === 'created',
      canPrintNormal: heading.find('a[href*="/cPosition/etiquette_colis/"]').length > 0,
      canPrintZebra: heading.find('a[href*="/cPosition/etiquette_colis_zebra/"]').length > 0,
    },
  };

  const [departureCity, departureLocality] = detail.departure.displayLabel.split(/\s*[-,]\s*/u).map(normalizeWhitespace);
  if (departureCity) {
    detail.departure.city = departureCity;
  }
  if (departureLocality) {
    detail.departure.locality = departureLocality;
  }

  const [destinationCity, destinationLocality] = detail.destination.displayLabel.split(/\s*[-,]\s*/u).map(normalizeWhitespace);
  if (destinationCity) {
    detail.destination.city = destinationCity;
  }
  if (destinationLocality) {
    detail.destination.locality = destinationLocality;
  }

  if (
    detail.dimensions.lengthCm != null &&
    detail.dimensions.widthCm != null &&
    detail.dimensions.heightCm != null
  ) {
    detail.dimensions.volume = Number(
      (detail.dimensions.lengthCm * detail.dimensions.widthCm * detail.dimensions.heightCm).toFixed(2),
    );
  }

  return detail;
};
