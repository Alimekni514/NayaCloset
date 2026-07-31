import { Link, createFileRoute } from '@tanstack/react-router';
import { ShoppingBag, Trash2 } from 'lucide-react';

import { EmptyState, LoadingSkeleton } from '@/components/common/states';
import { StoreLayout } from '@/components/store/StoreLayout';
import { QuantitySelector } from '@/components/store/QuantitySelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartDetails } from '@/features/store/use-cart-details';
import { useStore } from '@/features/store/store-context';
import { formatTND } from '@/lib/format';

export const Route = createFileRoute('/panier')({
  component: CartPage,
});

function CartPage() {
  const { setQuantity, removeFromCart, clearCart } = useStore();
  const { lines, subtotal, shippingFee, total, isLoading } = useCartDetails();

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Mon panier</h1>

        {isLoading ? (
          <div className="mt-8">
            <LoadingSkeleton count={3} />
          </div>
        ) : lines.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={ShoppingBag}
              title="Votre panier est vide"
              description="Ajoutez des articles au panier pour lancer une commande."
              action={
                <Button asChild>
                  <Link to="/produits">Voir le catalogue</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.key} className="surface-card flex flex-col gap-4 p-4 sm:flex-row">
                  <img
                    src={line.imageUrl}
                    alt={line.name}
                    loading="lazy"
                    width={900}
                    height={900}
                    className="size-28 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Link
                          to="/produits/$productId"
                          params={{ productId: line.productId }}
                          className="truncate font-semibold"
                        >
                          {line.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {line.selectedColor && <span>Couleur : {line.selectedColor}</span>}
                          {line.selectedSize && (
                            <Badge variant="secondary" className="text-xs">
                              {line.selectedSize}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatTND(line.unitPrice)} / unité</p>
                      </div>
                      <p className="shrink-0 font-display text-lg font-semibold">
                        {formatTND(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <QuantitySelector
                        value={line.quantity}
                        max={Math.max(1, line.stock)}
                        onChange={(value) => setQuantity(line.key, value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Retirer ${line.name}`}
                        onClick={() => removeFromCart(line.key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
              <li>
                <Button variant="ghost" onClick={clearCart}>
                  Vider le panier
                </Button>
              </li>
            </ul>

            <aside className="surface-card h-fit space-y-4 p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-xl font-semibold">Récapitulatif</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{formatTND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-medium">{shippingFee === 0 ? '0.000 TND' : formatTND(shippingFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatTND(total)}</span>
                </div>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link to="/commande">Passer la commande</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">Paiement a la livraison (COD)</p>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
