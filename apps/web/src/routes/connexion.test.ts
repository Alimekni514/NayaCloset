import { describe, expect, it } from 'vitest';

import { defaultRouteForRole, resolvePostLoginRedirect, sanitizeRedirect } from './connexion';

describe('connexion route helpers', () => {
  it('uses role-based default destinations', () => {
    expect(defaultRouteForRole('ADMIN')).toBe('/admin');
    expect(defaultRouteForRole('SUPER_ADMIN')).toBe('/admin');
    expect(defaultRouteForRole('CLIENT')).toBe('/compte');
    expect(defaultRouteForRole()).toBe('/compte');
  });

  it('preserves safe local redirects and rejects external values', () => {
    expect(sanitizeRedirect('/admin')).toBe('/admin');
    expect(sanitizeRedirect('/compte/commandes')).toBe('/compte/commandes');
    expect(sanitizeRedirect('https://example.com')).toBeUndefined();
    expect(sanitizeRedirect('//example.com')).toBeUndefined();
    expect(sanitizeRedirect('javascript:alert(1)')).toBeUndefined();
  });

  it('keeps users inside their route space after login', () => {
    expect(resolvePostLoginRedirect({ redirect: undefined, role: 'ADMIN' })).toBe('/admin');
    expect(resolvePostLoginRedirect({ redirect: undefined, role: 'CLIENT' })).toBe('/compte');
    expect(resolvePostLoginRedirect({ role: 'ADMIN', redirect: '/compte' })).toBe('/admin');
    expect(resolvePostLoginRedirect({ role: 'CLIENT', redirect: '/admin' })).toBe('/compte');
    expect(resolvePostLoginRedirect({ role: 'ADMIN', redirect: '/admin' })).toBe('/admin');
    expect(resolvePostLoginRedirect({ role: 'CLIENT', redirect: '/compte/commandes' })).toBe(
      '/compte/commandes',
    );
  });
});
