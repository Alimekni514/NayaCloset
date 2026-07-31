import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useProductsByIds } from "@/features/shared/queries";
import { useStore } from "@/features/store/store-context";

export const Route = createFileRoute("/favoris")({
  head: () => ({
    meta: [
      { title: "Mes favoris — Dar Souk" },
      { name: "description", content: "Retrouvez les produits Dar Souk que vous avez enregistrés." },
      { property: "og:title", content: "Mes favoris — Dar Souk" },
      { property: "og:description", content: "Vos produits enregistrés, prêts à commander." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites } = useStore();
  const { data: products, isLoading, error } = useProductsByIds(favorites);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Mes favoris</h1>
        <p className="mt-2 text-muted-foreground">{favorites.length} produit(s) enregistré(s).</p>

        <div className="mt-8">
          {favorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Aucun favori pour le moment"
              description="Touchez le cœur sur un produit pour le retrouver ici."
              action={
                <Button asChild>
                  <Link to="/produits">Parcourir le catalogue</Link>
                </Button>
              }
            />
          ) : (
            <ProductGrid products={products} isLoading={isLoading} error={error} />
          )}
        </div>
      </div>
    </StoreLayout>
  );
}