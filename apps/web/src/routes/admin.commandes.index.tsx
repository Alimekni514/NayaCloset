import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminOrderDetail,
  useAdminOrders,
  useApproveOrder,
  useDeclineOrder,
  useRetryOrderAbm,
} from '@/features/admin/orders/hooks/use-admin-orders';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDateTime, formatMillimesTnd } from '@/lib/format';

export const Route = createFileRoute('/admin/commandes/')({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const ordersQuery = useAdminOrders({ page: 1, pageSize: 10, sortBy: 'createdAt', sortDirection: 'desc' });
  const detailQuery = useAdminOrderDetail(selectedOrderId);
  const approveOrder = useApproveOrder();
  const declineOrder = useDeclineOrder();
  const retryOrder = useRetryOrderAbm();

  const items = ordersQuery.data?.items ?? [];
  const summary = ordersQuery.data?.summary;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Commandes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifiez les commandes visiteurs avant leur envoi vers ABM.
        </p>
      </header>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="En attente" value={summary.pending} />
          <SummaryCard label="En traitement ABM" value={summary.approving} />
          <SummaryCard label="Positions creees" value={summary.abmCreated} />
          <SummaryCard label="Erreurs ABM" value={summary.abmFailed} />
        </div>
      ) : null}

      {ordersQuery.isLoading ? (
        <LoadingSkeleton variant="table" count={6} />
      ) : ordersQuery.isError ? (
        <ErrorState message="Impossible de charger les commandes." onRetry={() => void ordersQuery.refetch()} />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  {['Reference', 'Client', 'Telephone', 'Destination', 'Articles', 'Sous-total', 'Livraison', 'Total', 'Date', 'Statut', 'Actions'].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium text-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">{order.reference}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{order.mobile}</td>
                    <td className="px-4 py-3">{order.destination}</td>
                    <td className="px-4 py-3">{order.itemsCount}</td>
                    <td className="px-4 py-3">{formatMillimesTnd(order.subtotalMillimes)}</td>
                    <td className="px-4 py-3">{formatMillimesTnd(order.deliveryFeeMillimes)}</td>
                    <td className="px-4 py-3">{formatMillimesTnd(order.totalMillimes)}</td>
                    <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">{readStatusLabel(order.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                          Voir
                        </Button>
                        {order.status === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              disabled={approveOrder.isPending}
                              onClick={() =>
                                approveOrder.mutate(order.id, {
                                  onSuccess: () => toast.success('La position ABM a ete creee avec succes.'),
                                  onError: () => toast.error('Impossible de creer la position ABM.'),
                                })
                              }
                            >
                              Approuver
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={declineOrder.isPending}
                              onClick={() => {
                                const reason = window.prompt('Motif du refus (optionnel)') ?? '';
                                declineOrder.mutate(
                                  { orderId: order.id, reason },
                                  {
                                    onSuccess: () => toast.success('Commande refusee et supprimee.'),
                                    onError: () => toast.error('Impossible de refuser cette commande.'),
                                  },
                                );
                              }}
                            >
                              Refuser
                            </Button>
                          </>
                        ) : null}
                        {order.status === 'ABM_FAILED' ? (
                          <Button
                            size="sm"
                            disabled={retryOrder.isPending}
                            onClick={() =>
                              retryOrder.mutate(order.id, {
                                onSuccess: () => toast.success('Nouvelle tentative ABM lancee.'),
                                onError: () => toast.error('Impossible de relancer ABM.'),
                              })
                            }
                          >
                            Reessayer
                          </Button>
                        ) : null}
                        {order.abmPositionId ? (
                          <Button asChild variant="outline" size="sm">
                            <Link to="/admin/positions/$positionId" params={{ positionId: order.abmPositionId }}>
                              Position ABM
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Sheet open={Boolean(selectedOrderId)} onOpenChange={(open) => setSelectedOrderId(open ? selectedOrderId : null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Detail commande</SheetTitle>
            <SheetDescription>Verification avant envoi vers ABM.</SheetDescription>
          </SheetHeader>
          {detailQuery.isLoading ? (
            <div className="mt-6">
              <LoadingSkeleton count={4} />
            </div>
          ) : detailQuery.isError ? (
            <div className="mt-6">
              <ErrorState
                message="Impossible de charger le detail de cette commande."
                onRetry={() => void detailQuery.refetch()}
              />
            </div>
          ) : detailQuery.data ? (
            <div className="mt-6 space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-semibold">Client</h3>
                <p>{detailQuery.data.order.customer.contactFirstName} {detailQuery.data.order.customer.contactLastName}</p>
                <p>{detailQuery.data.order.customer.mobile}</p>
                {detailQuery.data.order.customer.phone ? <p>{detailQuery.data.order.customer.phone}</p> : null}
              </section>
              <section className="space-y-2">
                <h3 className="font-semibold">Livraison</h3>
                <p>{detailQuery.data.order.deliveryAddress.addressLine1}</p>
                {detailQuery.data.order.deliveryAddress.addressLine2 ? <p>{detailQuery.data.order.deliveryAddress.addressLine2}</p> : null}
                <p>{detailQuery.data.order.deliveryAddress.locality.label}, {detailQuery.data.order.deliveryAddress.city.label}, {detailQuery.data.order.deliveryAddress.governorate.label}</p>
                <p>{detailQuery.data.order.deliveryAddress.postalCode}</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-semibold">Articles</h3>
                <ul className="space-y-2">
                  {detailQuery.data.order.items.map((item, index) => (
                    <li key={`${item.productId}-${index}`} className="flex justify-between gap-3 rounded-2xl border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.selectedColor && <span>Couleur : {item.selectedColor} </span>}
                          {item.selectedSize && <span>· Taille : {item.selectedSize} </span>}
                          · x{item.quantity}
                        </p>
                      </div>
                      <span>{formatMillimesTnd(item.lineTotalMillimes)}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="space-y-1 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ABM TAGS (prévisualisation)</h3>
                <p className="break-all font-mono text-sm">{detailQuery.data.order.abmPreview.parcel.TAGS || '—'}</p>
              </section>
              <section className="grid gap-4 sm:grid-cols-2">
                <PreviewBlock title="Step 1: Naya pickup" values={detailQuery.data.order.abmPreview.pickup} />
                <PreviewBlock title="Step 2: Livraison" values={detailQuery.data.order.abmPreview.delivery} />
                <PreviewBlock title="Step 3: Colis" values={detailQuery.data.order.abmPreview.parcel} />
                <PreviewBlock title="Step 4: Service" values={detailQuery.data.order.abmPreview.service} />
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function PreviewBlock({ title, values }: { title: string; values: Record<string, string> }) {
  return (
    <div className="rounded-3xl border p-4">
      <h4 className="font-semibold">{title}</h4>
      <dl className="mt-3 space-y-2">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="text-right">{value || '-'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function readStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'En attente';
    case 'APPROVING':
      return 'Traitement ABM';
    case 'ABM_CREATED':
      return 'Expedition creee';
    case 'ABM_FAILED':
      return 'Erreur ABM';
    default:
      return status;
  }
}
