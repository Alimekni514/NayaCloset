import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  PositionsFilters,
  PositionsPagination,
  PositionsSummary,
  PositionsTable,
  abmPositionsQueryKey,
} from '@/features/admin/abm-positions-list';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { AbmPositionListItem, AbmPositionsResponse } from '@delivery-commerce/shared';

const TODAY = '2026-07-29';

const mockPosition: AbmPositionListItem = {
  id: 'pos-001',
  barcode: 'ABM2026001',
  reference: 'REF-001',
  createdAt: `${TODAY}T10:00:00.000Z`,
  pickupDate: null,
  deliveryDate: null,
  updatedAt: `${TODAY}T10:00:00.000Z`,
  departure: { governorate: 'Tunis', city: 'Tunis', locality: 'Centre Ville' },
  recipient: {
    firstName: 'Ali',
    lastName: 'Ben Salem',
    fullName: 'Ali Ben Salem',
    phone: '20123456',
    email: 'ali@example.com',
  },
  destination: {
    governorate: 'Sfax',
    city: 'Sfax Ville',
    locality: 'Centre',
    postalCode: '3000',
    addressLine1: '12 Rue de la Republique',
  },
  service: 'ONP',
  codAmount: 45.5,
  eventId: 1,
  statusLabel: 'Creee',
  statusCategory: 'created',
  deliveryAttempts: 0,
  pieces: 1,
  permissions: { canView: true, canEdit: true, canDelete: true },
};

const mockResponse: AbmPositionsResponse = {
  items: [mockPosition],
  summary: {
    total: 1,
    totalCod: 45.5,
    delivered: 0,
    anomalies: 0,
  },
  period: {
    from: TODAY,
    to: TODAY,
  },
  syncedAt: `${TODAY}T10:00:00.000Z`,
};

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('ABM positions query contract', () => {
  it('builds a TanStack Query key with only from and to', () => {
    expect(
      abmPositionsQueryKey({
        from: TODAY,
        to: TODAY,
      }),
    ).toEqual([
      'admin',
      'abm',
      'positions',
      {
        from: TODAY,
        to: TODAY,
      },
    ]);
  });
});

describe('ABM positions local UI', () => {
  it('renders local summary cards from the normalized response', () => {
    renderWithProviders(<PositionsSummary summary={mockResponse.summary} />);

    expect(screen.getByText('Positions affichees')).toBeInTheDocument();
    expect(screen.getByText('Montant COD total')).toBeInTheDocument();
    expect(screen.getByText('Livrees')).toBeInTheDocument();
    expect(screen.getByText('En anomalie')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders filter controls without requiring backend-only params', () => {
    renderWithProviders(
      <PositionsFilters
        value={{
          dateFrom: TODAY,
          dateTo: TODAY,
          search: '',
          status: 'ALL',
          service: 'ALL',
          governorate: 'ALL',
        }}
        onChange={vi.fn()}
        onApply={vi.fn()}
        onReset={vi.fn()}
        resultCount={1}
      />,
    );

    expect(screen.getByLabelText('Date du')).toBeInTheDocument();
    expect(screen.getByLabelText('Date au')).toBeInTheDocument();
    expect(screen.getByLabelText(/Recherche/i)).toBeInTheDocument();
  });

  it('renders normalized rows locally', () => {
    renderWithProviders(
      <PositionsTable
        positions={mockResponse.items}
        sort={{ key: 'createdAt', direction: 'desc' }}
        onSortChange={vi.fn()}
        expandedId={null}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('ABM2026001')).toBeInTheDocument();
    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.getByText('Ali Ben Salem')).toBeInTheDocument();
    expect(screen.getByText('Sfax')).toBeInTheDocument();
  });

  it('renders local pagination controls', () => {
    renderWithProviders(
      <PositionsPagination
        page={1}
        pageSize={20}
        totalItems={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Affichage de 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
  });
});
