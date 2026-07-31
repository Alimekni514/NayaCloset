import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthGuard } from './auth-guard';
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
    useLocation: () => ({
      pathname: '/compte',
      searchStr: '',
    }),
  };
});

vi.mock('../hooks/use-current-user', () => ({
  useCurrentUser: vi.fn(),
}));

const mockedUseCurrentUser = vi.mocked(useCurrentUser);

describe('AuthGuard', () => {
  it('redirects unauthenticated users to the login page with a safe local redirect', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'unauthenticated',
      user: null,
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AuthGuard>
        <div>Customer area</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/connexion');
    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-search',
      JSON.stringify({ redirect: '/compte' }),
    );
  });

  it('redirects admins away from customer-only routes', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'authenticated',
      user: { role: 'ADMIN' },
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AuthGuard>
        <div>Customer area</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/admin');
  });

  it('allows authenticated clients through', () => {
    mockedUseCurrentUser.mockReturnValue({
      state: 'authenticated',
      user: { role: 'CLIENT' },
    } as ReturnType<typeof useCurrentUser>);

    render(
      <AuthGuard>
        <div>Customer area</div>
      </AuthGuard>,
    );

    expect(screen.getByText('Customer area')).toBeInTheDocument();
  });
});
