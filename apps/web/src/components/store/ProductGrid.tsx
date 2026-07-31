import { ProductCard } from "./ProductCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import type { Product } from "@/features/shared/types";

export function ProductGrid({
  products,
  isLoading,
  error,
  emptyTitle = "Aucun produit trouvé",
  emptyDescription = "Essayez d'ajuster votre recherche ou vos filtres.",
}: {
  products: Product[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (isLoading) return <LoadingSkeleton variant="grid" count={8} />;
  if (error) return <ErrorState message={(error as Error)?.message} />;
  if (!products?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
