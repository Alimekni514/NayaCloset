import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AbmDashboardFilters } from '@/features/admin/abm-dashboard';
import { useAbmDashboard } from '@/features/admin/abm-dashboard';

import { AdminDashboardPage } from './admin.index';

vi.mock('@/features/admin/abm-dashboard', async () => {
  const actual =
    await vi.importActual<typeof import('@/features/admin/abm-dashboard')>('@/features/admin/abm-dashboard');

  return {
    ...actual,
    useAbmDashboard: vi.fn(),
  };
});

const mockedUseAbmDashboard = vi.mocked(useAbmDashboard);

const dashboardResponse = {
  syncedAt: '2026-07-28T18:00:00.000Z',
  period: {
    from: '2026-07-01',
    to: '2026-07-28',
    filtered: true,
  },
  totals: {
    positions: 12,
    returns: 3,
    exchanges: 1,
  },
  groups: {
    POSITION: [
      { eventId: 1, label: 'Colis crees', count: 7, hasDate: true },
      { eventId: 25, label: 'Colis livres', count: 5, hasDate: true },
      { eventId: 555, label: 'Inconnu', count: 9, hasDate: true },
    ],
    RETOUR: [{ eventId: 29, label: 'Retours generes', count: 2, hasDate: true }],
    ECHANGE: [{ eventId: 36, label: 'Echanges generes', count: 1, hasDate: false }],
  },
};

describe('Admin dashboard', () => {
  it('renders totals, expected ABM groups, zero-filled missing events, and unknown events', async () => {
    const refetch = vi.fn();
    mockedUseAbmDashboard.mockReturnValue({
      data: dashboardResponse,
      error: null,
      isError: false,
      isLoading: false,
      isRefetching: false,
      refetch,
    } as unknown as ReturnType<typeof useAbmDashboard>);

    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    expect(screen.getByText('Total Position')).toBeInTheDocument();
    expect(screen.getByText('Total Retour')).toBeInTheDocument();
    expect(screen.getByText('Total Echange')).toBeInTheDocument();

    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Retour')).toBeInTheDocument();
    expect(screen.getByText('Echange')).toBeInTheDocument();

    expect(screen.getByText("Anomalies d'enlevement")).toBeInTheDocument();
    expect(screen.getByText('Retours en cours')).toBeInTheDocument();
    expect(screen.getByText("Anomalies d'echange")).toBeInTheDocument();
    expect(screen.getByText('Inconnu')).toBeInTheDocument();
    expect(screen.getByText(/du 2026-07-01 au 2026-07-28/i)).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Rafraichir' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows a safe error state when the dashboard cannot be loaded', () => {
    mockedUseAbmDashboard.mockReturnValue({
      data: undefined,
      error: { status: 503, message: 'sensitive backend detail' },
      isError: true,
      isLoading: false,
      isRefetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAbmDashboard>);

    render(<AdminDashboardPage />);

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByText("L'integration ABM n'est pas configuree.")).toBeInTheDocument();
    expect(screen.queryByText('sensitive backend detail')).not.toBeInTheDocument();
  });
});

describe('AbmDashboardFilters', () => {
  it('validates incomplete and invalid ranges, applies valid filters, and resets to all data', async () => {
    const onApply = vi.fn();
    const onReset = vi.fn();
    const user = userEvent.setup();

    render(
      <AbmDashboardFilters initialFrom="" initialTo="" onApply={onApply} onReset={onReset} />,
    );

    await user.type(screen.getByLabelText('Du'), '2026-07-28');
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(screen.getByText('Veuillez renseigner les deux dates.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Au'), '2026-07-01');
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(screen.getByText('La date de debut doit preceder la date de fin.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Du'));
    await user.type(screen.getByLabelText('Du'), '2026-07-01');
    await user.clear(screen.getByLabelText('Au'));
    await user.type(screen.getByLabelText('Au'), '2026-07-28');
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(onApply).toHaveBeenCalledWith({ from: '2026-07-01', to: '2026-07-28' });

    await user.click(screen.getByRole('button', { name: 'Voir tout' }));
    expect(onReset).toHaveBeenCalled();
  });
});
