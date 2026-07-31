import { describe, expect, it } from 'vitest';

import {
  buildAbmPositionsResponse,
  mapEventIdToStatus,
  mapExternalAbmPosition,
  parseAbmDate,
} from '../src/modules/abm/positions/abm-position-list.mapper';

const createRawPosition = (overrides: Record<string, unknown> = {}) => ({
  POSID: 'POS-1',
  POSBARCODE: 'BAR-1',
  POSREFERENCE: 'REF-1',
  DATECREATE: '/Date(1785339000000)/',
  POSDATEENL: '2026-07-29T12:00:00.000Z',
  POSDATELIV: '',
  DATEUPD: '',
  ENL_LIBELLEN1: 'Tunis',
  ENL_LIBELLEN2: 'Bab Bhar',
  ENL_LIBELLEN3: 'Centre Ville',
  LIV_LIBELLEN1: 'Ariana',
  LIV_LIBELLEN2: 'Raoued',
  LIV_LIBELLEN3: 'Borj Touil',
  LIV_CODEP: '2083',
  LIV_ADR1: 'Rue 1',
  LIV_ADR2: '',
  LIV_ADPCONTACTNOM: 'Beji',
  LIV_ADPCONTACTPRENOM: 'Sara',
  LIV_ADPPORTABLE: '55111222',
  LIV_EMAIL: 'Sara@example.com',
  SERVICEINTITULE: 'ONP',
  COLMNTCOD: 42.5,
  EVENTID: 1,
  STATLIBELLE: 'Creation etiquette',
  POSTENTATIVELIV: 0,
  POSNBPIECE: 2,
  ...overrides,
});

describe('abm-position-list.mapper', () => {
  it('parses ASP.NET dates, ISO strings, empty values, and invalid values safely', () => {
    expect(parseAbmDate('/Date(1785339000000)/')).toBe('2026-07-29T15:30:00.000Z');
    expect(parseAbmDate('2026-07-29T12:00:00.000Z')).toBe('2026-07-29T12:00:00.000Z');
    expect(parseAbmDate('2026-07-29')).toBe('2026-07-29T00:00:00.000Z');
    expect(parseAbmDate('')).toBeNull();
    expect(parseAbmDate(null)).toBeNull();
    expect(parseAbmDate('not-a-date')).toBeNull();
  });

  it('maps event ids to categories and edit/delete permissions', () => {
    expect(mapEventIdToStatus(1)).toEqual({
      category: 'created',
      canEdit: true,
      canDelete: true,
    });
    expect(mapEventIdToStatus(17)).toEqual({
      category: 'progress',
      canEdit: false,
      canDelete: false,
    });
    expect(mapEventIdToStatus(25).category).toBe('delivered');
    expect(mapEventIdToStatus(20).category).toBe('anomaly');
    expect(mapEventIdToStatus(29).category).toBe('return');
    expect(mapEventIdToStatus(999).category).toBe('neutral');
  });

  it('normalizes ABM rows and summarizes them', () => {
    const created = mapExternalAbmPosition(createRawPosition());
    const anomaly = mapExternalAbmPosition(
      createRawPosition({
        POSID: 'POS-2',
        POSBARCODE: 'BAR-2',
        POSREFERENCE: 'REF-2',
        DATECREATE: '/Date(1785252600000)/',
        LIV_LIBELLEN1: 'Sousse',
        SERVICEINTITULE: 'BLK',
        EVENTID: 20,
        STATLIBELLE: 'Anomalie livraison',
        LIV_ADPCONTACTNOM: 'Mekni',
        LIV_ADPCONTACTPRENOM: '',
        LIV_EMAIL: '',
        COLMNTCOD: 10,
      }),
    );
    const delivered = mapExternalAbmPosition(
      createRawPosition({
        POSID: 'POS-3',
        POSBARCODE: 'BAR-3',
        POSREFERENCE: 'REF-3',
        DATECREATE: '/Date(1785425400000)/',
        SERVICEINTITULE: 'FIX',
        EVENTID: 25,
        STATLIBELLE: 'Livre',
        COLMNTCOD: 100,
      }),
    );

    const items = [created, anomaly, delivered].map((normalized) => ({
      raw: createRawPosition(),
      normalized,
    }));

    const result = buildAbmPositionsResponse({
      items,
      query: { from: '2026-07-29', to: '2026-07-29' },
      syncedAt: '2026-07-29T12:00:00.000Z',
    });

    expect(result.items).toHaveLength(3);
    expect(result.summary).toEqual({
      total: 3,
      totalCod: 152.5,
      delivered: 1,
      anomalies: 1,
    });
    expect(result.period).toEqual({ from: '2026-07-29', to: '2026-07-29' });
    expect(result.syncedAt).toBe('2026-07-29T12:00:00.000Z');
  });
});
