import { expect, test, vi } from 'vitest';
import { getAbmPositions } from '../src/modules/abm/positions/abm-position-list.service';

const createPositionsListPayload = () =>
  JSON.stringify([
    {
      POSID: 'P-100',
      POSBARCODE: 'BAR-100',
      POSREFERENCE: 'CMD-100',
      DATECREATE: '/Date(1785339000000)/',
      POSDATEENL: '/Date(1785342600000)/',
      POSDATELIV: '',
      DATEUPD: '/Date(1785346200000)/',
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
      LIV_EMAIL: 'sara@example.com',
      SERVICEINTITULE: 'ONP',
      COLMNTCOD: '100.500',
      EVENTID: 1,
      STATLIBELLE: 'Creation etiquette',
      POSTENTATIVELIV: '0',
      POSNBPIECE: '2',
    }
  ]);

vi.mock('../src/modules/abm/index', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    getAbmSessionManager: () => ({
      getCookieDiagnostics: vi.fn().mockResolvedValue({
        applicationCookiePresent: true,
        antiforgeryCookiePresent: false,
        cookieCount: 1,
      }),
      getProtectedTextDetailed: vi.fn().mockResolvedValue({
        data: createPositionsListPayload(),
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        finalUrl: 'http://127.0.0.1:4105/cPosition',
      }),
    }),
  };
});

test('getAbmPositions executes without throwing 500 error', async () => {
  const res = await getAbmPositions({ from: '2026-07-29', to: '2026-07-29' } as any);
  expect(res.summary.total).toBe(1);
});
