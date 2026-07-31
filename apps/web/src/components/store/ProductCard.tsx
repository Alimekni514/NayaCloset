import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTND } from "@/lib/format";
import { useStore } from "@/features/store/store-context";
import type { Product } from "@/features/shared/types";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const favorite = isFavorite(product.id);
  const outOfStock = product.stock === 0;

  return (
    <article className="surface-card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Link to="/produits/$productId" params={{ productId: product.slug }} aria-label={product.name}>
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            width={900}
            height={900}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.compareAtPrice ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              Promo
            </span>
          ) : null}
          {outOfStock ? (
            <span className="rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-semibold text-background">
              Rupture
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-pressed={favorite}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-soft transition-colors hover:bg-card"
        >
          <Heart className={cn("size-4", favorite && "fill-destructive text-destructive")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">
            <Link to="/produits/$productId" params={{ productId: product.slug }}>
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{formatTND(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="text-xs text-muted-foreground line-through">{formatTND(product.compareAtPrice)}</p>
            ) : null}
          </div>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() => {
              addToCart({ productId: product.id, quantity: 1, name: product.name, ...(product.images[0] ? { imageUrl: product.images[0] } : {}), unitPrice: product.price });
              toast.success("Ajouté au panier", { description: product.name });
            }}
          >
            <ShoppingBag className="size-4" />
            Ajouter
          </Button>
        </div>
      </div>
    </article>
  );
}