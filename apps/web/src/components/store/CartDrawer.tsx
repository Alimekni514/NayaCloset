import { Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "./QuantitySelector";
import { EmptyState, LoadingSkeleton } from "@/components/common/states";
import { formatTND } from "@/lib/format";
import { useStore } from "@/features/store/store-context";
import { useCartDetails } from "@/features/store/use-cart-details";

export function CartDrawer() {
  const { cartOpen, setCartOpen, setQuantity, removeFromCart } = useStore();
  const { lines, subtotal, shippingFee, total, isLoading } = useCartDetails();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Votre panier</SheetTitle>
          <SheetDescription>
            {lines.length > 0 ? `${lines.length} article(s) prêt(s) à être livré(s)` : "Votre panier est vide"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : lines.length === 0 ? (
            <EmptyState
              title="Panier vide"
              description="Parcourez le catalogue et ajoutez vos articles préférés."
              icon={ShoppingBag}
              action={
                <Button asChild onClick={() => setCartOpen(false)}>
                  <Link to="/produits">Voir le catalogue</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4 py-2">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-3">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                    width={900}
                    height={900}
                    className="size-20 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{formatTND(product.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <QuantitySelector
                        value={quantity}
                        max={Math.max(1, product.stock)}
                        onChange={(value) => setQuantity(product.id, value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Retirer ${product.name}`}
                        onClick={() => removeFromCart(product.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <SheetFooter className="gap-3 border-t border-border">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatTND(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span className="font-medium">{shippingFee === 0 ? "Offerte" : formatTND(shippingFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatTND(total)}</span>
              </div>
            </div>
            <Button asChild size="lg" onClick={() => setCartOpen(false)}>
              <Link to="/commande">Passer la commande</Link>
            </Button>
            <Button asChild variant="outline" onClick={() => setCartOpen(false)}>
              <Link to="/panier">Voir le panier</Link>
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}