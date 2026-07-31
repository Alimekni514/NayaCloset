import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { usePositionFormOptions } from '@/features/admin/abm-position-create';
import { PositionWizard } from '@/features/admin/abm-position-create/components/PositionWizard';
import {
  useCities,
  useCreateAbmPosition,
  useDeliveryAddressDetail,
  useGovernorates,
  useLocalities,
  usePickupAddressDetail,
  usePostalCode,
} from '@/features/admin/abm-position-create/hooks/use-abm-position-create';

import { AdminPositionCreatePage } from './admin.positions.nouvelle';

vi.mock('@/features/admin/abm-position-create', async () => {
  const actual =
    await vi.importActual<typeof import('@/features/admin/abm-position-create')>('@/features/admin/abm-position-create');

  return {
    ...actual,
    usePositionFormOptions: vi.fn(),
  };
});

vi.mock('@/features/admin/abm-position-create/hooks/use-abm-position-create', () => ({
  useGovernorates: vi.fn(),
  useCities: vi.fn(),
  useLocalities: vi.fn(),
  usePostalCode: vi.fn(),
  usePickupAddressDetail: vi.fn(),
  useDeliveryAddressDetail: vi.fn(),
  useCreateAbmPosition: vi.fn(),
}));

const mockedUsePositionFormOptions = vi.mocked(usePositionFormOptions);
const mockedUseGovernorates = vi.mocked(useGovernorates);
const mockedUseCities = vi.mocked(useCities);
const mockedUseLocalities = vi.mocked(useLocalities);
const mockedUsePostalCode = vi.mocked(usePostalCode);
const mockedUsePickupAddressDetail = vi.mocked(usePickupAddressDetail);
const mockedUseDeliveryAddressDetail = vi.mocked(useDeliveryAddressDetail);
const mockedUseCreateAbmPosition = vi.mocked(useCreateAbmPosition);

const options = {
  pickupAddressBook: [{ id: 'pickup-1', label: 'Naya Store (EL OMRANE)', selected: false }],
  deliveryAddressBook: [{ id: 'delivery-1', label: 'Client VIP', selected: false }],
  governorates: [{ id: '11', label: 'Tunis' }],
  serviceOptions: [{ id: 'ONP', label: 'ONP', selected: true }],
  paymentModeOptions: [{ id: 'ESPECES', label: 'Especes', selected: true }],
  packagingOptions: [{ id: 'BOX', label: 'Box', selected: true }],
  merchandiseTypeOptions: [{ id: 'STD', label: 'Standard', selected: true }],
  defaults: {
    packagingId: 'BOX',
    merchandiseTypeId: 'STD',
    length: '1',
    height: '1',
    width: '1',
    volume: '1',
    pickupTime: '14:00',
  },
  preferredPickupAddressId: 'pickup-1',
};

describe('AdminPositionCreatePage', () => {
  it('shows a safe configuration error message', () => {
    mockedUsePositionFormOptions.mockReturnValue({
      data: undefined,
      error: { status: 503, message: 'sensitive backend detail' },
      isError: true,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePositionFormOptions>);

    render(<AdminPositionCreatePage />);

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByText("L'integration ABM n'est pas configuree.")).toBeInTheDocument();
    expect(screen.queryByText('sensitive backend detail')).not.toBeInTheDocument();
  });
});

describe('PositionWizard', () => {
  it('preselects Naya Store and shows the pickup step bootstrap state', async () => {
    window.sessionStorage.clear();
    mockedUseGovernorates.mockReturnValue({
      data: [{ id: '11', label: 'Tunis' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useGovernorates>);
    mockedUseCities.mockReturnValue({
      data: [{ id: '1101', label: 'Bab Bhar' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCities>);
    mockedUseLocalities.mockReturnValue({
      data: [{ id: '110101', label: 'Centre Ville' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useLocalities>);
    mockedUsePostalCode.mockReturnValue({
      data: { postalCode: '1000' },
      isFetching: false,
    } as unknown as ReturnType<typeof usePostalCode>);
    mockedUsePickupAddressDetail.mockReturnValue({
      data: {
        id: 'pickup-1',
        contactLastName: 'Store',
        contactFirstName: 'Naya',
        addressLine1: '12 Rue du Lac',
        addressLine2: 'Bloc B',
        governorateId: '11',
        cityId: '1101',
        localityId: '110101',
        postalCode: '1000',
        mobile: '20123456',
        phone: '71222333',
        fax: '71222334',
        email: 'pickup@example.com',
      },
      isError: false,
    } as unknown as ReturnType<typeof usePickupAddressDetail>);
    mockedUseDeliveryAddressDetail.mockReturnValue({
      data: undefined,
      isError: false,
    } as unknown as ReturnType<typeof useDeliveryAddressDetail>);
    mockedUseCreateAbmPosition.mockReturnValue({
      isPending: false,
      isError: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useCreateAbmPosition>);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PositionWizard options={options} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Adresse d\'enlevement')).toBeInTheDocument();
    });

    expect(screen.getByText(/Adresse (ABM selectionnee|personnalisee)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/naya store/i).length).toBeGreaterThan(0);
  });

  it('allows typing mobile and telephone without locking the pickup step', async () => {
    window.sessionStorage.clear();
    mockedUseGovernorates.mockReturnValue({
      data: [{ id: '11', label: 'Tunis' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useGovernorates>);
    mockedUseCities.mockReturnValue({
      data: [{ id: '1101', label: 'Bab Bhar' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCities>);
    mockedUseLocalities.mockReturnValue({
      data: [{ id: '110101', label: 'Centre Ville' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useLocalities>);
    mockedUsePostalCode.mockReturnValue({
      data: { postalCode: '1000' },
      isFetching: false,
    } as unknown as ReturnType<typeof usePostalCode>);
    mockedUsePickupAddressDetail.mockReturnValue({
      data: {
        id: 'pickup-1',
        contactLastName: 'Store',
        contactFirstName: 'Naya',
        addressLine1: '12 Rue du Lac',
        addressLine2: 'Bloc B',
        governorateId: '11',
        cityId: '1101',
        localityId: '110101',
        postalCode: '1000',
        mobile: '20123456',
        phone: '71222333',
        fax: '71222334',
        email: 'pickup@example.com',
      },
      isError: false,
    } as unknown as ReturnType<typeof usePickupAddressDetail>);
    mockedUseDeliveryAddressDetail.mockReturnValue({
      data: undefined,
      isError: false,
    } as unknown as ReturnType<typeof useDeliveryAddressDetail>);
    mockedUseCreateAbmPosition.mockReturnValue({
      isPending: false,
      isError: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useCreateAbmPosition>);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <PositionWizard options={options} />
      </QueryClientProvider>,
    );

    const mobileInput = await screen.findByLabelText('Mobile *');
    const phoneInput = await screen.findByLabelText('Telephone');

    await user.clear(mobileInput);
    await user.type(mobileInput, '55123456');
    await user.clear(phoneInput);
    await user.type(phoneInput, '71234567');

    expect(screen.getByLabelText('Mobile *')).toHaveValue('55123456');
    expect(screen.getByLabelText('Telephone')).toHaveValue('71234567');
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
  });
});
