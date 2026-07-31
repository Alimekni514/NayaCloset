import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { StoreProvider } from '@/features/store/store-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductPage } from './produits.$productId';
import { useProduct } from '@/features/shared/queries';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    createFileRoute: () => () => null,
    Link: ({ children }: any) => <a href="#">{children}</a>,
  };
});

// We must mock the route hook used inside ProductPage
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    createFileRoute: () => () => ({
      useParams: () => ({ productId: 'test-product' }),
    }),
    Link: ({ children }: any) => <a href="#">{children}</a>,
  };
});

vi.mock('@/features/shared/queries', () => ({
  useProduct: vi.fn(),
  useProductsByIds: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}));

const mockUseProduct = vi.mocked(useProduct);

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <StoreProvider>{ui}</StoreProvider>
    </QueryClientProvider>
  );
}

describe('ProductPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders size selector for configurable products', async () => {
    mockUseProduct.mockReturnValue({
      data: {
        id: '1',
        name: 'Pantalon Wide Leg Premium',
        price: 40000,
        images: ['img.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colorVariants: [
          { color: 'Beige', imageUrl: 'beige.jpg', availableSizes: ['S', 'M', 'L', 'XL'] }
        ],
        stock: 10,
        rating: 5
      },
      isLoading: false,
    } as any);

    renderWithProviders(<ProductPage />);
    
    // Size section should be visible
    expect(screen.getByText('Taille')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'XL' })).toBeInTheDocument();

    // The add variant button should be present
    expect(screen.getByRole('button', { name: /Ajouter cette variante/i })).toBeInTheDocument();
  });

  it('disables add variant button if no size is selected', async () => {
    const user = userEvent.setup();
    mockUseProduct.mockReturnValue({
      data: {
        id: '1',
        name: 'Pantalon Wide Leg Premium',
        price: 40000,
        images: ['img.jpg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colorVariants: [
          { color: 'Beige', imageUrl: 'beige.jpg', availableSizes: ['S', 'M', 'L', 'XL'] }
        ],
        stock: 10,
        rating: 5
      },
      isLoading: false,
    } as any);

    renderWithProviders(<ProductPage />);
    
    const addVariantBtn = screen.getByRole('button', { name: /Ajouter cette variante/i });
    await user.click(addVariantBtn);

    // Should show error text
    expect(screen.getByText('Veuillez choisir une taille.')).toBeInTheDocument();
    
    // Select a size
    const sizeM = screen.getByRole('button', { name: 'M' });
    await user.click(sizeM);

    // Error should disappear
    expect(screen.queryByText('Veuillez choisir une taille.')).not.toBeInTheDocument();

    // Now clicking add variant should work
    await user.click(addVariantBtn);

    // Pending variant should appear
    expect(screen.getByText('Variantes sélectionnées')).toBeInTheDocument();
  });

  it('hides size selector and shows simple add button for simple products', async () => {
    mockUseProduct.mockReturnValue({
      data: {
        id: '1',
        name: 'Simple Product',
        price: 10000,
        images: ['img.jpg'],
        stock: 10,
        rating: 5
      },
      isLoading: false,
    } as any);

    renderWithProviders(<ProductPage />);
    
    // Size section should NOT be visible
    expect(screen.queryByText('Taille')).not.toBeInTheDocument();
    
    // No variant button
    expect(screen.queryByRole('button', { name: /Ajouter cette variante/i })).not.toBeInTheDocument();

    // Should have direct add to cart button
    expect(screen.getByRole('button', { name: /Ajouter au panier/i })).toBeInTheDocument();
  });
});
