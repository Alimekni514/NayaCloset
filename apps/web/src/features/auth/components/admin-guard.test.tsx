import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminGuard } from './admin-guard';
import { useCurrentUser } from '../hooks/use-current-user';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');

  return {
    ...actual,
    Navigate: ({
      to,
      search,
    }: {
      to: string;
      search?: Record<string, unknown>;
    }) => <div data-testid="navigate" data-to={to} data-search={JSON.stringify(search ?? {})} />,
  };
});

vi.mock('../hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}));

const mockedUseCurrentUser = vi.mocked(useCurrentUser);

describe('AdminGuard', () => {
  it('shows a full-page loading state while the current user is loading', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'loading',
      user: null,
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AdminGuard>
        <div>Protected area</div>
      </AdminGuard>,
    );

    expect(screen.getByText("Chargement de l'administration")).toBeInTheDocument();
    expect(screen.queryByText('Protected area')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to the admin login with a safe redirect', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'unauthenticated',
      user: null,
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AdminGuard redirect="//malicious.example/admin">
        <div>Protected area</div>
      </AdminGuard>,
    );

    const navigation = screen.getByTestId('navigate');
    expect(navigation).toHaveAttribute('data-to', '/connexion');
    expect(navigation).toHaveAttribute('data-search', JSON.stringify({ redirect: '/admin' }));
  });

  it('keeps a neutral loading screen for transient non-authenticated states until the session is resolved', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'error',
      user: null,
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AdminGuard>
        <div>Protected area</div>
      </AdminGuard>,
    );

    expect(screen.getByText('Session en cours de verification')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects customers back to the storefront', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'authenticated',
      user: { role: 'CLIENT' },
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AdminGuard>
        <div>Protected area</div>
      </AdminGuard>,
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  });

  it('allows admins and super admins through', () => {
    const { rerender } = render(
      <AdminGuard>
        <div>Protected area</div>
      </AdminGuard>,
    );

    mockedUseCurrentUser.mockReturnValue({
      state: 'authenticated',
      user: { role: 'ADMIN' },
    } as ReturnType<typeof useCurrentUser>);
    rerender(
      <AdminGuard>
        <div>Protected area</div>
      </AdminGuard>,
    );
    expect(screen.getByText('Protected area')).toBeInTheDocument();

    mockedUseCurrentUser.mockReturnValue({
      state: 'authenticated',
      user: { role: 'SUPER_ADMIN' },
    } as ReturnType<typeof useCurrentUser>);
    rerender(
      <AdminGuard>
        <div>Protected area</div>
      </AdminGuard>,
    );
    expect(screen.getByText('Protected area')).toBeInTheDocument();
  });
});
