import { Link, createFileRoute } from '@tanstack/react-router';

import { AuthGuard } from '@/features/auth';
import { useOrder } from '@/features/shared/queries';
import { formatDateTime, formatTND } from '@/lib/format';

import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/compte/commandes/$orderId')({
  head: () => ({
    meta: [
      { title: 'Detail de commande - Dar Souk' },
      {
        name: 'description',
        content: 'Suivi detaille de votre commande : articles, adresse et statut de livraison.',
      },
    ],
  }),
  component: CustomerOrderPage,
});

function CustomerOrderPage() {
  const { orderId } = Route.useParams();
  const { data: order, isLoading, error, refetch } = useOrder(orderId);

  return (
    <StoreLayout>
      <AuthGuard>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          {isLoading ? (
            <LoadingSkeleton count={4} />
          ) : error || !order ? (
            <ErrorState message="Commande introuvable." onRetry={() => refetch()} />
          ) : (
            <>
              <nav className="text-sm text-muted-foreground">
                <Link to="/compte/commandes" className="hover:text-foreground">
                  Mes commandes
                </Link>
                <span aria-hidden> / </span>
                <span className="text-foreground">{order.reference}</span>
              </nav>

              <header className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0">
                  <h1 className="truncate font-display text-3xl font-semibold">{order.reference}</h1>
                  <p className="text-sm text-muted-foreground">
                    Passee le {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </header>

              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <section className="surface-card p-6">
                    <h2 className="font-display text-xl font-semibold">Suivi de livraison</h2>
                    <div className="mt-6">
                      <OrderTimeline events={order.timeline} />
                    </div>
                    {order.abm.trackingNumber ? (
                      <p className="mt-6 text-sm text-muted-foreground">
                        Numero de suivi transporteur :{' '}
                        <span className="font-semibold text-foreground">
                          {order.abm.trackingNumber}
                        </span>
                      </p>
                    ) : null}
                    {order.rejectionReason ? (
                      <p className="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                        Motif du rejet : {order.rejectionReason}
                      </p>
                    ) : null}
                  </section>

                  <section className="surface-card p-6">
                    <h2 className="font-display text-xl font-semibold">Articles</h2>
                    <ul className="mt-4 space-y-4">
                      {order.items.map((item) => (
                        <li key={item.productId} className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            className="size-16 shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x {formatTND(item.unitPrice)}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold">
                            {formatTND(item.unitPrice * item.quantity)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="surface-card p-6">
                    <h2 className="font-display text-lg font-semibold">Adresse de livraison</h2>
                    <address className="mt-3 space-y-1 text-sm not-italic text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {order.address.firstName} {order.address.lastName}
                      </p>
                      <p>{order.address.addressLine1}</p>
                      {order.address.addressLine2 ? <p>{order.address.addressLine2}</p> : null}
                      <p>
                        {order.address.locality}, {order.address.city}
                      </p>
                      <p>
                        {order.address.postalCode} {order.address.governorate}
                      </p>
                      <p>{order.address.phone}</p>
                    </address>
                  </section>

                  <section className="surface-card space-y-2 p-6 text-sm">
                    <h2 className="font-display text-lg font-semibold">Total</h2>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{formatTND(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span>
                        {order.shippingFee === 0 ? 'Offerte' : formatTND(order.shippingFee)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span>A payer a la livraison</span>
                      <span>{formatTND(order.total)}</span>
                    </div>
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </AuthGuard>
    </StoreLayout>
  );
}
