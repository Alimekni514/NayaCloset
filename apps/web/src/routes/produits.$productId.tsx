import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { QuantitySelector } from "@/components/store/QuantitySelector";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { useProduct } from "@/features/shared/queries";
import { useStore } from "@/features/store/store-context";
import { formatTND } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produits/$productId")({
  head: () => ({
    meta: [
      { title: "Fiche produit — Dar Souk" },
      { name: "description", content: "Détails, prix en TND, stock et livraison du produit sélectionné." },
      { property: "og:title", content: "Fiche produit — Dar Souk" },
      { property: "og:description", content: "Galerie, description, disponibilité et ajout au panier." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { data: product, isLoading, error, refetch } = useProduct(productId);
  const { addToCart, toggleFavorite, isFavorite, setCartOpen } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <LoadingSkeleton count={4} />
        ) : error || !product ? (
          <ErrorState message="Ce produit n'existe pas ou n'est plus disponible." onRetry={() => refetch()} />
        ) : (
          <>
            <nav className="text-sm text-muted-foreground">
              <Link to="/produits" className="hover:text-foreground">
                Catalogue
              </Link>
              <span aria-hidden> / </span>
              <span className="text-foreground">{product.name}</span>
            </nav>

            <div className="mt-6 grid gap-10 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-3xl bg-secondary">
                  <img
                    src={product.images[activeImage]}
                    alt={product.name}
                    width={900}
                    height={900}
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`Image ${index + 1}`}
                      aria-current={activeImage === index}
                      className={cn(
                        "size-20 overflow-hidden rounded-2xl border-2 transition-colors",
                        activeImage === index ? "border-primary" : "border-transparent",
                      )}
                    >
                      <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h1 className="font-display text-3xl font-semibold sm:text-4xl">{product.name}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="size-4 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
                  <span>· Avis vérifiés</span>
                </div>

                <div className="mt-6 flex items-end gap-3">
                  <p className="font-display text-3xl font-semibold">{formatTND(product.price)}</p>
                  {product.compareAtPrice ? (
                    <p className="pb-1 text-muted-foreground line-through">{formatTND(product.compareAtPrice)}</p>
                  ) : null}
                </div>

                <p className="mt-2 text-sm">
                  {product.stock > 0 ? (
                    <span className="font-medium text-success">En stock — {product.stock} unité(s)</span>
                  ) : (
                    <span className="font-medium text-destructive">Rupture de stock</span>
                  )}
                </p>

                <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

                <Separator className="my-6" />

                <div className="flex flex-wrap items-center gap-3">
                  <QuantitySelector
                    value={quantity}
                    max={Math.max(1, product.stock)}
                    onChange={setQuantity}
                  />
                  <Button
                    size="lg"
                    disabled={product.stock === 0}
                    onClick={() => {
                      addToCart(product.id, quantity);
                      setCartOpen(true);
                      toast.success("Ajouté au panier", { description: product.name });
                    }}
                  >
                    <ShoppingBag className="size-4" />
                    Ajouter au panier
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => toggleFavorite(product.id)}
                    aria-pressed={isFavorite(product.id)}
                  >
                    <Heart className={cn("size-4", isFavorite(product.id) && "fill-destructive text-destructive")} />
                    Favori
                  </Button>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="surface-card flex items-center gap-3 p-4">
                    <Truck className="size-5 shrink-0 text-primary" />
                    <p className="text-sm">Livraison 48–72 h partout en Tunisie</p>
                  </div>
                  <div className="surface-card flex items-center gap-3 p-4">
                    <ShieldCheck className="size-5 shrink-0 text-primary" />
                    <p className="text-sm">Paiement à la livraison sécurisé</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}