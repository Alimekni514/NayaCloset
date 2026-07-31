import { Link, createFileRoute } from '@tanstack/react-router';
import { Package } from 'lucide-react';

import { AuthGuard, useCurrentUser } from '@/features/auth';
import { useCustomerOrders } from '@/features/shared/queries';
import { formatDate, formatTND } from '@/lib/format';

import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/compte/commandes/')({
  head: () => ({
    meta: [
      { title: 'Mes commandes - Dar Souk' },
      {
        name: 'description',
        content: 'Historique de vos commandes Dar Souk et statut de livraison.',
      },
    ],
  }),
  component: OrderHistoryPage,
});

function OrderHistoryPage() {
  const { user } = useCurrentUser();
  const { data: orders, isLoading, error } = useCustomerOrders(user?.id ?? '');

  return (
    <StoreLayout>
      <AuthGuard>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Mes commandes</h1>

          <div className="mt-8">
            {isLoading ? (
              <LoadingSkeleton count={4} />
            ) : error ? (
              <ErrorState message={(error as Error).message} />
            ) : !orders?.length ? (
              <EmptyState
                icon={Package}
                title="Aucune commande"
                description="Vos commandes apparaitront ici apres votre premier achat."
                action={
                  <Button asChild>
                    <Link to="/produits">Commencer mes achats</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-4">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to="/compte/commandes/$orderId"
                      params={{ orderId: order.id }}
                      className="surface-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 transition-shadow hover:shadow-lift"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{order.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)} - {order.items.length} article(s)
                        </p>
                        <div className="mt-2">
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </div>
                      <p className="shrink-0 font-display text-lg font-semibold">
                        {formatTND(order.total)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AuthGuard>
    </StoreLayout>
  );
}
