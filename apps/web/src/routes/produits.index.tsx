import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useProducts } from "@/features/shared/queries";
import { formatTND } from "@/lib/format";

type SortKey = "recent" | "price-asc" | "price-desc" | "rating";

interface CatalogSearch {
  q?: string;
  categorie?: string;
  max?: number;
  tri?: SortKey;
}

interface CatalogSearchInput {
  q: string | undefined;
  categorie: string | undefined;
  max: number | undefined;
  tri: SortKey | undefined;
}

interface CatalogSearchPatch {
  q?: string | undefined;
  categorie?: string | undefined;
  max?: number | undefined;
  tri?: SortKey | undefined;
}

const buildCatalogSearch = (input: CatalogSearchInput): CatalogSearch => ({
  ...(input.q ? { q: input.q } : {}),
  ...(input.categorie ? { categorie: input.categorie } : {}),
  ...(input.max !== undefined ? { max: input.max } : {}),
  ...(input.tri ? { tri: input.tri } : {}),
});

export const Route = createFileRoute("/produits/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch =>
    buildCatalogSearch({
      q: typeof search.q === "string" && search.q ? search.q : undefined,
      categorie: typeof search.categorie === "string" && search.categorie ? search.categorie : undefined,
      max: Number(search.max) > 0 ? Number(search.max) : undefined,
      tri: (["recent", "price-asc", "price-desc", "rating"] as const).includes(search.tri as SortKey)
        ? (search.tri as SortKey)
        : undefined,
    }),
  head: () => ({
    meta: [
      { title: "Catalogue — Dar Souk" },
      {
        name: "description",
        content: "Parcourez tous les produits Dar Souk : filtres par catégorie, prix et tri, prix en TND.",
      },
      { property: "og:title", content: "Catalogue Dar Souk" },
      { property: "og:description", content: "Recherchez, filtrez et commandez en quelques clics." },
    ],
  }),
  component: CatalogPage,
});

const MAX_PRICE = 1200;

function CatalogPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories } = useCategories();

  const categoryId = categories?.find((c) => c.slug === search.categorie)?.id ?? null;
  const { data: products, isLoading, error } = useProducts({
    ...(search.q ? { search: search.q } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search.max !== undefined ? { maxPrice: search.max } : {}),
    sort: search.tri ?? "recent",
  });

  const update = (patch: CatalogSearchPatch) =>
    navigate({
      to: ".",
      search: (prev: CatalogSearch) =>
        buildCatalogSearch({
          q: patch.q !== undefined ? patch.q : prev.q,
          categorie: patch.categorie !== undefined ? patch.categorie : prev.categorie,
          max: patch.max !== undefined ? patch.max : prev.max,
          tri: patch.tri !== undefined ? patch.tri : prev.tri,
        }),
    });

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Catalogue</h1>
          <p className="mt-2 text-muted-foreground">
            {products?.length ?? 0} produit(s) disponibles, livrés partout en Tunisie.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="surface-card h-fit space-y-6 p-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="size-4" /> Filtres
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={search.q ?? ""}
                  placeholder="Nom du produit…"
                  className="pl-9"
                  onChange={(event) => update({ q: event.target.value || undefined })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={search.categorie ?? "all"}
                onValueChange={(value) => update({ categorie: value === "all" ? undefined : value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="price">Prix maximum</Label>
              <Slider
                id="price"
                min={50}
                max={MAX_PRICE}
                step={10}
                value={[search.max ?? MAX_PRICE]}
                onValueChange={([value]) => update({ max: value === MAX_PRICE ? undefined : value })}
              />
              <p className="text-sm text-muted-foreground">
                Jusqu'à {formatTND(search.max ?? MAX_PRICE)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort">Trier par</Label>
              <Select value={search.tri ?? "recent"} onValueChange={(value) => update({ tri: value as SortKey })}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Nouveautés</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: ".", search: {} })}
            >
              Réinitialiser
            </Button>
          </aside>

          <ProductGrid products={products} isLoading={isLoading} error={error} />
        </div>
      </div>
    </StoreLayout>
  );
}
