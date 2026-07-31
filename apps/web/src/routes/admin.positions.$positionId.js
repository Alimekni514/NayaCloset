import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { apiErrorUtils } from '@/lib/api-client';
import { fetchAbmPositionLabelDocument, PositionDetailError, PositionDetailHeader, PositionDetailSkeleton, PositionDetailSummary, PositionDimensionsCard, PositionMetadataCard, PositionProgress, PositionRecipientCard, PositionRouteCard, PositionShipmentCard, PositionTrackingTimeline, abmPositionDetailQueryKey, isValidPositionId, useAbmPositionDetail, } from '@/features/admin/abm-position-detail';
import { abmPositionsQueryKey, useDeleteAbmPosition } from '@/features/admin/abm-positions-list';
import { createPreviewPopup, getPositionLabelActionKind, getPositionLabelActionVariant, isPreviewAction, PopupBlockedError, presentPositionLabelDocument, setPreviewLoadingDocument, } from '@/features/admin/abm-position-detail/lib/position-label-download';
const detailSearchSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    service: z.string().optional(),
    governorate: z.string().optional(),
    sortBy: z
        .enum([
        'barcode',
        'reference',
        'createdAt',
        'pickupDate',
        'deliveryDate',
        'recipient',
        'governorate',
        'codAmount',
        'status',
    ])
        .optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().optional(),
});
export const Route = createFileRoute('/admin/positions/$positionId')({
    validateSearch: detailSearchSchema,
    head: () => ({
        meta: [{ title: 'Detail position - Admin Dar Souk' }],
    }),
    component: PositionDetailPage,
});
function mapDetailError(error) {
    if (apiErrorUtils.isApiError(error)) {
        if (error.status === 400)
            return 'Identifiant de position invalide.';
        if (error.status === 401)
            return 'Votre session a expire. Veuillez vous reconnecter.';
        if (error.status === 403)
            return "Vous n'etes pas autorise a consulter cette position.";
        if (error.status === 404)
            return 'Position introuvable.';
        const code = typeof error.details === 'object' && error.details !== null && 'code' in error.details
            ? String(error.details.code ?? '')
            : '';
        if (code === 'ABM_LOGIN_FAILED')
            return 'Impossible de se connecter a ABM.';
        if (code === 'ABM_POSITION_DETAIL_PARSE_FAILED') {
            return 'Impossible de lire les informations de cette position.';
        }
    }
    return 'Impossible de charger le detail ABM.';
}
function mapDeleteError(error) {
    if (apiErrorUtils.isApiError(error)) {
        if (error.status === 401)
            return 'Votre session a expire. Veuillez vous reconnecter.';
        const code = typeof error.details === 'object' && error.details !== null && 'code' in error.details
            ? String(error.details.code ?? '')
            : '';
        if (code === 'ABM_POSITION_DELETE_NOT_ALLOWED')
            return 'Cette position ne peut plus etre supprimee.';
        if (code === 'ABM_POSITION_DELETE_FAILED')
            return 'Impossible de supprimer la position.';
        if (code === 'ABM_BAD_RESPONSE')
            return 'ABM a retourne une reponse inattendue.';
    }
    return 'Impossible de supprimer la position.';
}
function mapPrintError(error) {
    if (apiErrorUtils.isApiError(error)) {
        if (error.status === 401)
            return 'Votre session a expire. Veuillez vous reconnecter.';
        if (error.status === 403)
            return "Vous n'etes pas autorise a imprimer cette etiquette.";
        if (error.status === 404)
            return 'Cette position est introuvable.';
        if (error.status === 502)
            return "Impossible de preparer l'etiquette.";
        const code = typeof error.details === 'object' && error.details !== null && 'code' in error.details
            ? String(error.details.code ?? '')
            : '';
        if (code === 'ABM_LOGIN_FAILED')
            return 'Impossible de se connecter a ABM.';
        if (code === 'ABM_LABEL_UNSUPPORTED_FORMAT') {
            return "Le format de l'etiquette n'est pas pris en charge.";
        }
        if (code === 'ABM_LABEL_EMPTY') {
            return 'ABM a retourne une etiquette vide.';
        }
        if (code === 'ABM_LABEL_FETCH_FAILED') {
            return "Impossible de previsualiser l'etiquette.";
        }
    }
    return "Impossible de generer le PDF.";
}
function mergeDetailWithListContext(detail, listItem) {
    if (!listItem) {
        return detail;
    }
    return {
        ...detail,
        reference: detail.reference ?? listItem.reference,
        pickupDate: detail.pickupDate ?? listItem.pickupDate,
        deliveryDate: detail.deliveryDate ?? listItem.deliveryDate,
        updatedAt: detail.updatedAt ?? listItem.updatedAt,
        recipient: detail.recipient ?? listItem.recipient,
        destination: {
            ...listItem.destination,
            ...detail.destination,
            displayLabel: detail.destination.displayLabel || listItem.destination.city,
        },
        departure: {
            ...listItem.departure,
            ...detail.departure,
            displayLabel: detail.departure.displayLabel || [listItem.departure.city, listItem.departure.locality].join(', '),
        },
        shipment: {
            ...detail.shipment,
            ...(detail.shipment.service ? {} : { service: listItem.service }),
            ...(detail.shipment.codAmount != null ? {} : { codAmount: listItem.codAmount }),
            ...(detail.shipment.pieces != null ? {} : { pieces: listItem.pieces }),
            ...(detail.shipment.reference ? {} : { reference: listItem.reference }),
        },
        attempts: detail.attempts ?? listItem.deliveryAttempts,
        permissions: {
            ...detail.permissions,
            canEdit: detail.permissions.canEdit || listItem.permissions.canEdit,
            canDelete: detail.permissions.canDelete || listItem.permissions.canDelete,
        },
    };
}
function PositionDetailPage() {
    const { positionId } = Route.useParams();
    const search = Route.useSearch();
    const navigate = useNavigate({ from: '/admin/positions/$positionId' });
    const queryClient = useQueryClient();
    const deleteMutation = useDeleteAbmPosition();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [printLoadingAction, setPrintLoadingAction] = useState(null);
    const detailQuery = useAbmPositionDetail(positionId);
    const listData = search.from && search.to
        ? queryClient.getQueryData(abmPositionsQueryKey({ from: search.from, to: search.to }))
        : undefined;
    const listItem = listData?.items.find((item) => item.id === positionId);
    const position = useMemo(() => (detailQuery.data ? mergeDetailWithListContext(detailQuery.data, listItem) : undefined), [detailQuery.data, listItem]);
    const backSearch = useMemo(() => ({
        from: search.from,
        to: search.to,
        search: search.search,
        status: search.status,
        service: search.service,
        governorate: search.governorate,
        sortBy: search.sortBy,
        sortDirection: search.sortDirection,
        page: search.page,
        pageSize: search.pageSize,
    }), [search]);
    const handleDelete = async () => {
        if (!position) {
            return;
        }
        try {
            await deleteMutation.mutateAsync(position.id);
            toast.success('Position supprimee', { description: position.barcode });
            void queryClient.invalidateQueries({ queryKey: abmPositionDetailQueryKey(position.id) });
            if (search.from && search.to) {
                void queryClient.invalidateQueries({
                    queryKey: abmPositionsQueryKey({ from: search.from, to: search.to }),
                });
            }
            await navigate({ to: '/admin/positions', search: backSearch });
        }
        catch (error) {
            toast.error(mapDeleteError(error));
        }
        finally {
            setConfirmDelete(false);
        }
    };
    const handlePrint = async (action) => {
        const popup = createPreviewPopup(action);
        if (isPreviewAction(action) && popup === null) {
            toast.error("Le navigateur a bloque l'ouverture de l'etiquette. Autorisez les fenetres contextuelles puis reessayez.");
            return;
        }
        setPreviewLoadingDocument(popup);
        setPrintLoadingAction(action);
        try {
            const variant = getPositionLabelActionVariant(action);
            const kind = getPositionLabelActionKind(action);
            const label = await fetchAbmPositionLabelDocument(positionId, variant, kind);
            const result = await presentPositionLabelDocument({
                label,
                action,
                positionId,
                popup,
            });
            if (kind === 'pdf') {
                toast.success('Le PDF a ete telecharge.', { description: result.filename });
            }
        }
        catch (error) {
            if (popup) {
                popup.close();
            }
            if (error instanceof PopupBlockedError) {
                toast.error("Le navigateur a bloque l'ouverture de l'etiquette. Autorisez les fenetres contextuelles puis reessayez.");
                return;
            }
            toast.error(mapPrintError(error));
        }
        finally {
            setPrintLoadingAction(null);
        }
    };
    if (!isValidPositionId(positionId)) {
        return _jsx(PositionDetailError, { message: "Identifiant de position invalide.", backSearch: backSearch });
    }
    if (detailQuery.isLoading && !position) {
        return _jsx(PositionDetailSkeleton, {});
    }
    if (detailQuery.isError || !position) {
        return (_jsx(PositionDetailError, { message: mapDetailError(detailQuery.error), backSearch: backSearch, onRetry: () => void detailQuery.refetch() }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(PositionDetailHeader, { position: position, backSearch: backSearch, refreshing: detailQuery.isFetching, onRefresh: () => void detailQuery.refetch(), onDelete: () => setConfirmDelete(true), printLoadingAction: printLoadingAction, onPrint: (action) => void handlePrint(action) }), _jsx(PositionDetailSummary, { position: position }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.55fr)]", children: [_jsx(PositionTrackingTimeline, { events: position.events }), _jsxs("div", { className: "space-y-6", children: [_jsx(PositionProgress, { position: position }), _jsx(PositionRouteCard, { position: position }), _jsx(PositionRecipientCard, { position: position }), _jsx(PositionShipmentCard, { position: position }), _jsx(PositionDimensionsCard, { position: position }), _jsx(PositionMetadataCard, { position: position })] })] }), _jsx(ConfirmDialog, { open: confirmDelete, onOpenChange: setConfirmDelete, title: "Supprimer cette position ?", description: `Cette action ne pourra pas etre annulee. La position ${position.barcode} sera definitivement supprimee.`, confirmLabel: "Supprimer", cancelLabel: "Annuler", destructive: true, disabled: deleteMutation.isPending, onConfirm: () => void handleDelete() })] }));
}
