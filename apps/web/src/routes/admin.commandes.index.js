import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminOrderDetail, useAdminOrders, useApproveOrder, useDeclineOrder, useRetryOrderAbm, } from '@/features/admin/orders/hooks/use-admin-orders';
import { ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDateTime, formatMillimesTnd } from '@/lib/format';
export const Route = createFileRoute('/admin/commandes/')({
    component: AdminOrdersPage,
});
function AdminOrdersPage() {
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const ordersQuery = useAdminOrders({ page: 1, pageSize: 10, sortBy: 'createdAt', sortDirection: 'desc' });
    const detailQuery = useAdminOrderDetail(selectedOrderId);
    const approveOrder = useApproveOrder();
    const declineOrder = useDeclineOrder();
    const retryOrder = useRetryOrderAbm();
    const items = ordersQuery.data?.items ?? [];
    const summary = ordersQuery.data?.summary;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Commandes" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Verifiez les commandes visiteurs avant leur envoi vers ABM." })] }), summary ? (_jsxs("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: [_jsx(SummaryCard, { label: "En attente", value: summary.pending }), _jsx(SummaryCard, { label: "En traitement ABM", value: summary.approving }), _jsx(SummaryCard, { label: "Positions creees", value: summary.abmCreated }), _jsx(SummaryCard, { label: "Erreurs ABM", value: summary.abmFailed })] })) : null, ordersQuery.isLoading ? (_jsx(LoadingSkeleton, { variant: "table", count: 6 })) : ordersQuery.isError ? (_jsx(ErrorState, { message: "Impossible de charger les commandes.", onRetry: () => void ordersQuery.refetch() })) : (_jsx("div", { className: "surface-card overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-secondary/60 text-left", children: _jsx("tr", { children: ['Reference', 'Client', 'Telephone', 'Destination', 'Articles', 'Sous-total', 'Livraison', 'Total', 'Date', 'Statut', 'Actions'].map((label) => (_jsx("th", { className: "px-4 py-3 font-medium text-foreground", children: label }, label))) }) }), _jsx("tbody", { children: items.map((order) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "px-4 py-3 font-semibold", children: order.reference }), _jsx("td", { className: "px-4 py-3", children: order.customerName }), _jsx("td", { className: "px-4 py-3", children: order.mobile }), _jsx("td", { className: "px-4 py-3", children: order.destination }), _jsx("td", { className: "px-4 py-3", children: order.itemsCount }), _jsx("td", { className: "px-4 py-3", children: formatMillimesTnd(order.subtotalMillimes) }), _jsx("td", { className: "px-4 py-3", children: formatMillimesTnd(order.deliveryFeeMillimes) }), _jsx("td", { className: "px-4 py-3", children: formatMillimesTnd(order.totalMillimes) }), _jsx("td", { className: "px-4 py-3", children: formatDateTime(order.createdAt) }), _jsx("td", { className: "px-4 py-3", children: readStatusLabel(order.status) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setSelectedOrderId(order.id), children: "Voir" }), order.status === 'PENDING' ? (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", disabled: approveOrder.isPending, onClick: () => approveOrder.mutate(order.id, {
                                                                    onSuccess: () => toast.success('La position ABM a ete creee avec succes.'),
                                                                    onError: () => toast.error('Impossible de creer la position ABM.'),
                                                                }), children: "Approuver" }), _jsx(Button, { variant: "destructive", size: "sm", disabled: declineOrder.isPending, onClick: () => {
                                                                    const reason = window.prompt('Motif du refus (optionnel)') ?? '';
                                                                    declineOrder.mutate({ orderId: order.id, reason }, {
                                                                        onSuccess: () => toast.success('Commande refusee et supprimee.'),
                                                                        onError: () => toast.error('Impossible de refuser cette commande.'),
                                                                    });
                                                                }, children: "Refuser" })] })) : null, order.status === 'ABM_FAILED' ? (_jsx(Button, { size: "sm", disabled: retryOrder.isPending, onClick: () => retryOrder.mutate(order.id, {
                                                            onSuccess: () => toast.success('Nouvelle tentative ABM lancee.'),
                                                            onError: () => toast.error('Impossible de relancer ABM.'),
                                                        }), children: "Reessayer" })) : null, order.abmPositionId ? (_jsx(Button, { asChild: true, variant: "outline", size: "sm", children: _jsx(Link, { to: "/admin/positions/$positionId", params: { positionId: order.abmPositionId }, children: "Position ABM" }) })) : null] }) })] }, order.id))) })] }) }) })), _jsx(Sheet, { open: Boolean(selectedOrderId), onOpenChange: (open) => setSelectedOrderId(open ? selectedOrderId : null), children: _jsxs(SheetContent, { className: "w-full overflow-y-auto sm:max-w-2xl", children: [_jsxs(SheetHeader, { children: [_jsx(SheetTitle, { children: "Detail commande" }), _jsx(SheetDescription, { children: "Verification avant envoi vers ABM." })] }), detailQuery.isLoading ? (_jsx("div", { className: "mt-6", children: _jsx(LoadingSkeleton, { count: 4 }) })) : detailQuery.isError ? (_jsx("div", { className: "mt-6", children: _jsx(ErrorState, { message: "Impossible de charger le detail de cette commande.", onRetry: () => void detailQuery.refetch() }) })) : detailQuery.data ? (_jsxs("div", { className: "mt-6 space-y-6 text-sm", children: [_jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "Client" }), _jsxs("p", { children: [detailQuery.data.order.customer.contactFirstName, " ", detailQuery.data.order.customer.contactLastName] }), _jsx("p", { children: detailQuery.data.order.customer.mobile }), detailQuery.data.order.customer.phone ? _jsx("p", { children: detailQuery.data.order.customer.phone }) : null] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "Livraison" }), _jsx("p", { children: detailQuery.data.order.deliveryAddress.addressLine1 }), detailQuery.data.order.deliveryAddress.addressLine2 ? _jsx("p", { children: detailQuery.data.order.deliveryAddress.addressLine2 }) : null, _jsxs("p", { children: [detailQuery.data.order.deliveryAddress.locality.label, ", ", detailQuery.data.order.deliveryAddress.city.label, ", ", detailQuery.data.order.deliveryAddress.governorate.label] }), _jsx("p", { children: detailQuery.data.order.deliveryAddress.postalCode })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "font-semibold", children: "Articles" }), _jsx("ul", { className: "space-y-2", children: detailQuery.data.order.items.map((item, index) => (_jsxs("li", { className: "flex justify-between gap-3 rounded-2xl border p-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-medium", children: item.productName }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [item.selectedColor && _jsxs("span", { children: ["Couleur : ", item.selectedColor, " "] }), item.selectedSize && _jsxs("span", { children: ["\u00B7 Taille : ", item.selectedSize, " "] }), "\u00B7 x", item.quantity] })] }), _jsx("span", { children: formatMillimesTnd(item.lineTotalMillimes) })] }, `${item.productId}-${index}`))) })] }), _jsxs("section", { className: "space-y-1 rounded-2xl border border-primary/30 bg-primary/5 p-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "ABM TAGS (pr\u00E9visualisation)" }), _jsx("p", { className: "break-all font-mono text-sm", children: detailQuery.data.order.abmPreview.parcel.TAGS || '—' })] }), _jsxs("section", { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(PreviewBlock, { title: "Step 1: Naya pickup", values: detailQuery.data.order.abmPreview.pickup }), _jsx(PreviewBlock, { title: "Step 2: Livraison", values: detailQuery.data.order.abmPreview.delivery }), _jsx(PreviewBlock, { title: "Step 3: Colis", values: detailQuery.data.order.abmPreview.parcel }), _jsx(PreviewBlock, { title: "Step 4: Service", values: detailQuery.data.order.abmPreview.service })] })] })) : null] }) })] }));
}
function SummaryCard({ label, value }) {
    return (_jsxs("div", { className: "surface-card p-5", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: label }), _jsx("p", { className: "mt-2 font-display text-3xl font-semibold", children: value })] }));
}
function PreviewBlock({ title, values }) {
    return (_jsxs("div", { className: "rounded-3xl border p-4", children: [_jsx("h4", { className: "font-semibold", children: title }), _jsx("dl", { className: "mt-3 space-y-2", children: Object.entries(values).map(([key, value]) => (_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "text-muted-foreground", children: key }), _jsx("dd", { className: "text-right", children: value || '-' })] }, key))) })] }));
}
function readStatusLabel(status) {
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
