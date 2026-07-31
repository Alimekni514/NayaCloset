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
import { COLOR_SWATCH_CSS } from "@/features/shared/product-assets";
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
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const hasColorVariants = product?.colorVariants && product.colorVariants.length > 0;

  // Resolve the displayed image: if a color is selected use that variant's image,
  // otherwise use the thumbnail index from the plain images array.
  const displayedImage = (() => {
    if (!product) return undefined;
    if (hasColorVariants && activeColor !== null) {
      const variant = product.colorVariants!.find((v) => v.color === activeColor);
      return variant?.imageUrl ?? product.images[activeImage];
    }
    return product.images[activeImage];
  })();

  const handleColorSelect = (color: string, imageUrl: string) => {
    setActiveColor(color);
    // Also update activeImage so the thumbnail strip (if shown) stays consistent
    if (!hasColorVariants) return;
    const idx = product!.colorVariants!.findIndex((v) => v.color === color);
    if (idx !== -1) setActiveImage(idx);
    // Prefetch the image so the swap is instant (browser caches it)
    const img = new Image();
    img.src = imageUrl;
  };

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
              {/* ── Image gallery ── */}
              <div className="space-y-4">
                <div className="overflow-hidden rounded-3xl bg-secondary">
                  <img
                    key={displayedImage}
                    src={displayedImage}
                    alt={product.name}
                    width={900}
                    height={900}
                    className="aspect-square w-full object-cover transition-opacity duration-200"
                  />
                </div>

                {/* Color swatches — shown when product has colorVariants */}
                {hasColorVariants ? (
                  <div className="flex flex-wrap gap-3" role="group" aria-label="Choisir une couleur">
                    {product.colorVariants!.map((variant) => {
                      const swatchColor = COLOR_SWATCH_CSS[variant.color] ?? '#888888';
                      const isSelected = activeColor === variant.color || (activeColor === null && variant === product.colorVariants![0]);
                      return (
                        <button
                          key={variant.color}
                          type="button"
                          onClick={() => handleColorSelect(variant.color, variant.imageUrl)}
                          aria-label={variant.color}
                          aria-pressed={isSelected}
                          title={variant.color}
                          className={cn(
                            "relative size-10 rounded-full border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isSelected
                              ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)] scale-110"
                              : "border-border hover:border-primary/60 hover:scale-105",
                            variant.color === "White" && "border-border/60",
                          )}
                          style={{ backgroundColor: swatchColor }}
                        >
                          {/* Inner ring for white swatch visibility */}
                          {variant.color === "White" && (
                            <span className="absolute inset-[3px] rounded-full border border-border/30" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Thumbnail strip for products without color variants */
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
                )}

                {/* Active color label */}
                {hasColorVariants && (
                  <p className="text-sm text-muted-foreground">
                    Couleur :{" "}
                    <span className="font-medium text-foreground">
                      {activeColor ?? product.colorVariants?.[0]?.color}
                    </span>
                  </p>
                )}
              </div>

              {/* ── Product info ── */}
              <div>
                <h1 className="font-display text-3xl font-semibold sm:text-4xl">{product.name}</h1>
                {product.category && (
                  <p className="mt-1 text-sm font-medium uppercase tracking-wider text-primary">
                    {product.category}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="size-4 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
                  <span>· Avis vérifiés</span>
                </div>

                {/* Price */}
                <div className="mt-6 space-y-1">
                  <div className="flex items-end gap-3">
                    <p className="font-display text-3xl font-semibold">{formatTND(product.price)}</p>
                    {product.compareAtPrice ? (
                      <p className="pb-1 text-muted-foreground line-through">{formatTND(product.compareAtPrice)}</p>
                    ) : null}
                  </div>
                  {product.deliveryFee != null && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Truck className="size-3.5 shrink-0" />
                      Livraison :{" "}
                      <span className="font-medium text-foreground">{formatTND(product.deliveryFee)}</span>
                    </p>
                  )}
                </div>

                <p className="mt-2 text-sm">
                  {product.stock > 0 ? (
                    <span className="font-medium text-success">En stock — {product.stock} unité(s)</span>
                  ) : (
                    <span className="font-medium text-destructive">Rupture de stock</span>
                  )}
                </p>

                {/* Description — supports Arabic RTL via dir=auto */}
                <p
                  className="mt-6 leading-relaxed text-muted-foreground"
                  dir="auto"
                  lang="ar"
                >
                  {product.description}
                </p>

                <Separator className="my-6" />

                {/* Add to cart */}
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

                {/* Trust badges */}
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

                {/* Total breakdown if delivery fee set */}
                {product.deliveryFee != null && (
                  <div className="mt-4 surface-card p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Produit</span>
                      <span>{formatTND(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison</span>
                      <span>{formatTND(product.deliveryFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total estimé</span>
                      <span>{formatTND(product.price + product.deliveryFee)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}