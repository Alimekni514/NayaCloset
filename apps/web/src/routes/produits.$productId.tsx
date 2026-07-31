import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    ],
  }),
  component: ProductPage,
});

type VariantLine = {
  color: string;
  colorImageUrl: string;
  size: string;
  quantity: number;
};

function ProductPage() {
  const { productId } = Route.useParams();
  const { data: product, isLoading, error, refetch } = useProduct(productId);
  const { addToCart, toggleFavorite, isFavorite, setCartOpen } = useStore();

  // Current selector state
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [selectorQty, setSelectorQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  // Pending variant lines the user is building before committing to cart
  const [pendingLines, setPendingLines] = useState<VariantLine[]>([]);

  const hasColorVariants = product?.colorVariants && product.colorVariants.length > 0;
  const hasSizes = product?.sizes && product.sizes.length > 0;

  // Resolve displayed image based on active color
  const displayedImage = (() => {
    if (!product) return undefined;
    if (hasColorVariants && activeColor) {
      const variant = product.colorVariants!.find((v) => v.color === activeColor);
      return variant?.imageUrl ?? product.images[0];
    }
    return product.images[0];
  })();

  const handleColorSelect = (color: string, imageUrl: string) => {
    setActiveColor(color);
    // Prefetch image for instant swap
    const img = new Image();
    img.src = imageUrl;
  };

  const handleAddVariant = () => {
    if (!product) return;
    if (hasSizes && !activeSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    const colorImageUrl = activeColor
      ? (product.colorVariants?.find((v) => v.color === activeColor)?.imageUrl ?? product.images[0] ?? '')
      : (product.images[0] ?? '');
    const colorLabel = activeColor ?? '';
    const sizeLabel = activeSize ?? '';

    setPendingLines((prev) => {
      const existing = prev.find((l) => l.color === colorLabel && l.size === sizeLabel);
      if (existing) {
        return prev.map((l) =>
          l.color === colorLabel && l.size === sizeLabel
            ? { ...l, quantity: l.quantity + selectorQty }
            : l,
        );
      }
      return [...prev, { color: colorLabel, colorImageUrl, size: sizeLabel, quantity: selectorQty }];
    });

    // Reset quantity after adding
    setSelectorQty(1);
  };

  const handleCommitToCart = () => {
    if (!product) return;
    if (pendingLines.length === 0) {
      // No pending lines — direct add (products without variants)
      addToCart({
        productId: product.id,
        quantity: selectorQty,
        name: product.name,
        ...(product.images[0] ? { imageUrl: product.images[0] } : {}),
        unitPrice: product.price,
      });
      setCartOpen(true);
      toast.success("Ajouté au panier", { description: product.name });
      return;
    }

    for (const line of pendingLines) {
      addToCart({
        productId: product.id,
        quantity: line.quantity,
        ...(line.color ? { selectedColor: line.color } : {}),
        ...(line.size ? { selectedSize: line.size } : {}),
        ...(line.colorImageUrl ? { imageUrl: line.colorImageUrl } : {}),
        name: product.name,
        unitPrice: product.price,
      });
    }
    setPendingLines([]);
    setCartOpen(true);
    const totalQty = pendingLines.reduce((s, l) => s + l.quantity, 0);
    toast.success(`${totalQty} article(s) ajouté(s) au panier`, { description: product.name });
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
              {/* ── Image ── */}
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

                {/* Color swatches */}
                {hasColorVariants && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Couleur :{" "}
                      <span className="font-medium text-foreground">
                        {activeColor ?? product.colorVariants![0]?.color}
                      </span>
                    </p>
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
                                ? "scale-110 border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
                                : "border-border hover:scale-105 hover:border-primary/60",
                              variant.color === "White" && "border-border/60",
                            )}
                            style={{ backgroundColor: swatchColor }}
                          >
                            {variant.color === "White" && (
                              <span className="absolute inset-[3px] rounded-full border border-border/30" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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

                {/* Description */}
                <p className="mt-6 leading-relaxed text-muted-foreground" dir="auto">
                  {product.description}
                </p>

                <Separator className="my-6" />

                {/* ── Size selector ── */}
                {hasSizes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Taille{" "}
                      {activeSize && (
                        <span className="ml-1 font-semibold text-foreground">{activeSize}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir une taille">
                      {product.sizes!.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setActiveSize(size);
                            setSizeError(false);
                          }}
                          aria-pressed={activeSize === size}
                          className={cn(
                            "min-w-[2.75rem] rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all",
                            activeSize === size
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60 hover:bg-muted",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {sizeError && (
                      <p className="text-xs text-destructive" role="alert">
                        Veuillez choisir une taille.
                      </p>
                    )}
                  </div>
                )}

                {/* ── Quantity + add variant ── */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {/* Quantity control */}
                  <div className="flex items-center rounded-xl border">
                    <button
                      type="button"
                      onClick={() => setSelectorQty((q) => Math.max(1, q - 1))}
                      className="flex size-10 items-center justify-center rounded-l-xl hover:bg-muted"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{selectorQty}</span>
                    <button
                      type="button"
                      onClick={() => setSelectorQty((q) => Math.min(20, q + 1))}
                      className="flex size-10 items-center justify-center rounded-r-xl hover:bg-muted"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {/* Add variant button (shown when product has sizes) */}
                  {hasSizes ? (
                    <Button
                      variant="outline"
                      disabled={product.stock === 0}
                      onClick={handleAddVariant}
                    >
                      <Plus className="size-4" />
                      Ajouter cette variante
                    </Button>
                  ) : null}

                  <Button
                    size="lg"
                    disabled={product.stock === 0 || (hasSizes && pendingLines.length === 0 && !activeSize)}
                    onClick={handleCommitToCart}
                  >
                    <ShoppingBag className="size-4" />
                    {pendingLines.length > 0 ? `Ajouter au panier (${pendingLines.reduce((s, l) => s + l.quantity, 0)})` : "Ajouter au panier"}
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

                {/* ── Pending variant lines ── */}
                {pendingLines.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-semibold">Variantes sélectionnées</p>
                    <ul className="space-y-2">
                      {pendingLines.map((line) => (
                        <li
                          key={`${line.color}|${line.size}`}
                          className="flex items-center gap-3 rounded-2xl border p-3"
                        >
                          {/* Color swatch thumbnail */}
                          {line.colorImageUrl ? (
                            <img
                              src={line.colorImageUrl}
                              alt={line.color}
                              className="size-10 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              className="size-10 shrink-0 rounded-xl border"
                              style={{ backgroundColor: COLOR_SWATCH_CSS[line.color] ?? '#888' }}
                            />
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {line.color && <span>{line.color}</span>}
                              {line.color && line.size && <span className="text-muted-foreground">—</span>}
                              {line.size && <Badge variant="secondary">{line.size}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatTND(product.price)} / unité</p>
                          </div>
                          {/* Inline qty control */}
                          <div className="flex items-center rounded-lg border text-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setPendingLines((prev) =>
                                  prev.map((l) =>
                                    l.color === line.color && l.size === line.size
                                      ? { ...l, quantity: Math.max(1, l.quantity - 1) }
                                      : l,
                                  ),
                                )
                              }
                              className="flex size-8 items-center justify-center hover:bg-muted"
                              aria-label="Diminuer"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-8 text-center font-semibold">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingLines((prev) =>
                                  prev.map((l) =>
                                    l.color === line.color && l.size === line.size
                                      ? { ...l, quantity: Math.min(20, l.quantity + 1) }
                                      : l,
                                  ),
                                )
                              }
                              className="flex size-8 items-center justify-center hover:bg-muted"
                              aria-label="Augmenter"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingLines((prev) =>
                                prev.filter((l) => !(l.color === line.color && l.size === line.size)),
                              )
                            }
                            aria-label="Supprimer cette variante"
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

                {/* Total breakdown */}
                {product.deliveryFee != null && (
                  <div className="mt-4 surface-card space-y-2 p-4 text-sm">
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