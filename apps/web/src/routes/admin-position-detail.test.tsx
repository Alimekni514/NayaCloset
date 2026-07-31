import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

import {
  PositionDetailHeader,
  PositionDetailSummary,
  PositionDimensionsCard,
  PositionMetadataCard,
  PositionProgress,
  PositionRecipientCard,
  PositionRouteCard,
  PositionShipmentCard,
  PositionTrackingTimeline,
  abmPositionDetailQueryKey,
  isValidPositionId,
} from '@/features/admin/abm-position-detail';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/admin/positions">{children}</a>,
}));

const detail: AbmPositionDetail = {
  id: '469384',
  barcode: '414000469384',
  status: {
    label: 'Livraison planifiée en cours de tournée',
    category: 'progress',
  },
  progressStage: 'delivery',
  createdAt: '2026-07-27T14:38:29.000Z',
  pickupDate: '2026-07-28T22:06:18.000Z',
  deliveryDate: null,
  updatedAt: '2026-07-29T08:48:00.000Z',
  departure: {
    displayLabel: 'Omrane, EL OMRANE',
    city: 'Omrane',
    locality: 'EL OMRANE',
  },
  destination: {
    displayLabel: 'ben guerdane, BEN GUERDANE',
    governorate: 'Médenine',
    city: 'Ben Guerdane',
    locality: 'BEN GUERDANE',
    postalCode: '8160',
  },
  recipient: {
    fullName: 'Ali Mekni',
    phone: '55879759',
  },
  shipment: {
    type: 'ONP',
    service: 'COD',
    weightKg: 2,
    pieces: 1,
    codAmount: 550,
    reference: 'CMD-550',
    allowOpen: false,
  },
  dimensions: {
    lengthCm: 1,
    widthCm: 1,
    heightCm: 1,
    volume: 1,
  },
  attempts: 2,
  events: [
    {
      id: 'event-1',
      label: 'Livraison planifiée en cours de tournée',
      occurredAt: '2026-07-29T08:48:00.000Z',
      isCurrent: true,
    },
    {
      id: 'event-2',
      label: 'Planification Livraison',
      occurredAt: '2026-07-29T08:47:58.000Z',
      isCurrent: false,
    },
    {
      id: 'event-3',
      label: 'Création étiquette position',
      occurredAt: '2026-07-27T14:38:29.000Z',
      isCurrent: false,
    },
  ],
  permissions: {
    canEdit: false,
    canDelete: false,
    canPrintNormal: true,
    canPrintZebra: true,
  },
};

describe('ABM position detail query contract', () => {
  it('builds the TanStack Query key with the raw POSID', () => {
    expect(abmPositionDetailQueryKey('469384')).toEqual(['admin', 'abm', 'position-detail', '469384']);
  });

  it('validates raw numeric POSIDs only', () => {
    expect(isValidPositionId('469384')).toBe(true);
    expect(isValidPositionId('414000469384')).toBe(true);
    expect(isValidPositionId('POS-469384')).toBe(false);
    expect(isValidPositionId('469384/evil')).toBe(false);
  });
});

describe('ABM position detail UI', () => {
  it('renders summary, status and shipment detail cards', () => {
    render(
      <>
        <PositionDetailSummary position={detail} />
        <PositionShipmentCard position={detail} />
      </>,
    );

    expect(screen.getByText('Statut actuel')).toBeInTheDocument();
    expect(screen.getAllByText('Service').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Montant COD').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Nombre de pièces').length).toBeGreaterThan(1);
    expect(screen.getAllByText('COD').length).toBeGreaterThan(0);
    expect(screen.getByText('CMD-550')).toBeInTheDocument();
    expect(screen.getByText('Non')).toBeInTheDocument();
  });

  it('renders the timeline newest-first and highlights the current event', () => {
    render(<PositionTrackingTimeline events={detail.events} />);

    const labels = screen.getAllByText(/Livraison planifiée en cours de tournée|Planification Livraison|Création étiquette position/);
    expect(labels[0]).toHaveTextContent('Livraison planifiée en cours de tournée');
    expect(screen.getByText('Événement actuel')).toBeInTheDocument();
  });

  it('renders progression, route and technical metadata', () => {
    render(
      <>
        <PositionProgress position={detail} />
        <PositionRouteCard position={detail} />
        <PositionDimensionsCard position={detail} />
        <PositionMetadataCard position={detail} />
      </>,
    );

    expect(screen.getByText('Progression de l\'expédition')).toBeInTheDocument();
    expect(screen.getByText('Enlèvement')).toBeInTheDocument();
    expect(screen.getByText('Livraison')).toBeInTheDocument();
    expect(screen.getByText('Livré')).toBeInTheDocument();
    expect(screen.getByText('Itinéraire')).toBeInTheDocument();
    expect(screen.getByText('Omrane, EL OMRANE')).toBeInTheDocument();
    expect(screen.getByText('ben guerdane, BEN GUERDANE')).toBeInTheDocument();
    expect(screen.getByText('Informations techniques')).toBeInTheDocument();
    expect(screen.getByText('469384')).toBeInTheDocument();
    expect(screen.getByText('414000469384')).toBeInTheDocument();
  });

  it('renders recipient fallbacks when optional fields are missing', () => {
    render(
      <PositionRecipientCard
        position={{
          ...detail,
          recipient: undefined,
          destination: {
            ...detail.destination,
            governorate: undefined,
            postalCode: undefined,
          },
        }}
      />,
    );

    expect(screen.getAllByText('Non disponible').length).toBeGreaterThan(2);
  });

  it('shows the four print actions in the header menu', async () => {
    const user = userEvent.setup();

    render(
      <PositionDetailHeader
        position={detail}
        refreshing={false}
        onRefresh={vi.fn()}
        onDelete={vi.fn()}
        printLoadingAction={null}
        onPrint={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Imprimer/i }));

    expect(screen.getByText('Previsualiser etiquette normale')).toBeInTheDocument();
    expect(screen.getByText('Telecharger PDF normal')).toBeInTheDocument();
    expect(screen.getByText('Previsualiser etiquette Zebra')).toBeInTheDocument();
    expect(screen.getByText('Telecharger PDF Zebra')).toBeInTheDocument();
  });
});
