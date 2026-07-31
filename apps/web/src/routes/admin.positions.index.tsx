import { useEffect, useMemo, useState } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { toast } from 'sonner';
import type { AbmPositionListItem, AbmPositionsResponse } from '@delivery-commerce/shared';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  PositionMobileCard,
  PositionsExportMenu,
  PositionsFilters,
  PositionsHeader,
  PositionsPagination,
  PositionsSummary,
  PositionsTable,
  copyToClipboard,
  copyPositionsCsv,
  exportPositionsCsv,
  printPositions,
  todayISODate,
  useAbmPositions,
  useDeleteAbmPosition,
  type PositionSort,
  type PositionSortKey,
  type PositionsDraftFilters,
} from '@/features/admin/abm-positions-list';
import { apiErrorUtils } from '@/lib/api-client';

const today = () => todayISODate();

const positionsSearchSchema = z.object({
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
  pageSize: z.coerce.number().int().refine((value) => [10, 20, 50].includes(value)).optional(),
});

export const Route = createFileRoute('/admin/positions/')({
  validateSearch: positionsSearchSchema,
  head: () => ({
    meta: [
      { title: 'Mes positions ABM - Admin Dar Souk' },
      {
        name: 'description',
        content: "Consultez, filtrez et gerez toutes vos expeditions ABM depuis l'admin Dar Souk.",
      },
    ],
  }),
  component: PositionsListPage,
});

function buildDraftFromSearch(search: z.infer<typeof positionsSearchSchema>): PositionsDraftFilters {
  const defaultDate = today();

  return {
    dateFrom: search.from ?? defaultDate,
    dateTo: search.to ?? defaultDate,
    search: search.search ?? '',
    status: search.status ?? 'ALL',
    service: search.service ?? 'ALL',
    governorate: search.governorate ?? 'ALL',
  };
}

function defaultDraft(): PositionsDraftFilters {
  const defaultDate = today();

  return {
    dateFrom: defaultDate,
    dateTo: defaultDate,
    search: '',
    status: 'ALL',
    service: 'ALL',
    governorate: 'ALL',
  };
}

function mapDeleteError(error: unknown): string {
  if (apiErrorUtils.isApiError(error)) {
    if (error.status === 401) {
      return 'Votre session a expire. Veuillez vous reconnecter.';
    }

    const code =
      typeof error.details === 'object' && error.details !== null && 'code' in error.details
        ? String((error.details as { code?: unknown }).code ?? '')
        : '';

    if (code === 'ABM_POSITION_DELETE_NOT_ALLOWED') {
      return 'Cette position ne peut plus etre supprimee.';
    }

    if (code === 'ABM_BAD_RESPONSE') {
      return 'ABM a retourne une reponse inattendue.';
    }

    if (code === 'ABM_POSITION_DELETE_FAILED') {
      return 'Impossible de supprimer la position.';
    }
  }

  return 'Impossible de supprimer la position.';
}

function matchesSearch(position: AbmPositionListItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    position.barcode,
    position.reference,
    position.recipient.fullName,
    position.recipient.phone,
    position.destination.governorate,
    position.destination.city,
    position.destination.locality,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

function comparePositions(
  left: AbmPositionListItem,
  right: AbmPositionListItem,
  sortBy: PositionSortKey,
  sortDirection: 'asc' | 'desc',
): number {
  const direction = sortDirection === 'asc' ? 1 : -1;

  const leftValue: string | number =
    sortBy === 'barcode'
      ? left.barcode
      : sortBy === 'reference'
        ? left.reference
        : sortBy === 'createdAt'
          ? left.createdAt ?? ''
          : sortBy === 'pickupDate'
            ? left.pickupDate ?? ''
            : sortBy === 'deliveryDate'
              ? left.deliveryDate ?? ''
              : sortBy === 'recipient'
                ? left.recipient.fullName
                : sortBy === 'governorate'
                  ? left.destination.governorate
                  : sortBy === 'codAmount'
                    ? left.codAmount
                    : left.statusLabel;

  const rightValue: string | number =
    sortBy === 'barcode'
      ? right.barcode
      : sortBy === 'reference'
        ? right.reference
        : sortBy === 'createdAt'
          ? right.createdAt ?? ''
          : sortBy === 'pickupDate'
            ? right.pickupDate ?? ''
            : sortBy === 'deliveryDate'
              ? right.deliveryDate ?? ''
              : sortBy === 'recipient'
                ? right.recipient.fullName
                : sortBy === 'governorate'
                  ? right.destination.governorate
                  : sortBy === 'codAmount'
                    ? right.codAmount
                    : right.statusLabel;

  if (leftValue < rightValue) {
    return -1 * direction;
  }

  if (leftValue > rightValue) {
    return 1 * direction;
  }

  return 0;
}

function buildLocalSummary(items: AbmPositionListItem[]): AbmPositionsResponse['summary'] {
  return {
    total: items.length,
    totalCod: items.reduce((sum, item) => sum + item.codAmount, 0),
    delivered: items.filter((item) => item.statusCategory === 'delivered').length,
    anomalies: items.filter((item) => item.statusCategory === 'anomaly').length,
  };
}

function PositionsListPage() {
  const navigate = useNavigate({ from: '/admin/positions/' });
  const search = Route.useSearch() as z.infer<typeof positionsSearchSchema>;

  const from = search.from ?? today();
  const to = search.to ?? today();
  const currentPage = search.page ?? 1;
  const currentPageSize = search.pageSize ?? 20;
  const sortBy = (search.sortBy ?? 'createdAt') as PositionSortKey;
  const sortDirection = (search.sortDirection ?? 'desc') as 'asc' | 'desc';

  const { data, isLoading, isFetching, isError, refetch } = useAbmPositions({ from, to });
  const deleteMutation = useDeleteAbmPosition();

  const [draft, setDraft] = useState<PositionsDraftFilters>(() => buildDraftFromSearch(search));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AbmPositionListItem | null>(null);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  useEffect(() => {
    setDraft(buildDraftFromSearch(search));
  }, [search]);

  const filteredItems = useMemo(() => {
    const statusFilter = search.status;
    const serviceFilter = search.service;
    const governorateFilter = search.governorate;

    return [...(data?.items ?? [])]
      .filter((position) => matchesSearch(position, search.search ?? ''))
      .filter((position) => (statusFilter ? position.statusCategory === statusFilter : true))
      .filter((position) => (serviceFilter ? position.service === serviceFilter : true))
      .filter((position) =>
        governorateFilter ? position.destination.governorate === governorateFilter : true,
      )
      .sort((left, right) => comparePositions(left, right, sortBy, sortDirection));
  }, [data?.items, search.governorate, search.search, search.service, search.status, sortBy, sortDirection]);

  const summary = useMemo(() => buildLocalSummary(filteredItems), [filteredItems]);
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
  const validPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (validPage !== currentPage) {
      void navigate({
        replace: true,
        search: (previous) => ({ ...previous, page: validPage }),
      });
    }
  }, [currentPage, navigate, validPage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (validPage - 1) * currentPageSize;
    return filteredItems.slice(startIndex, startIndex + currentPageSize);
  }, [currentPageSize, filteredItems, validPage]);

  const pagination = {
    page: validPage,
    pageSize: currentPageSize,
    totalItems,
    totalPages,
  };

  const updateSearch = (updates: Partial<z.infer<typeof positionsSearchSchema>>) => {
    void navigate({
      replace: true,
      search: (previous) => ({
        ...previous,
        ...updates,
      }),
    });
  };

  const handleApplyFilters = () => {
    updateSearch({
      from: draft.dateFrom,
      to: draft.dateTo,
      search: draft.search || undefined,
      status: draft.status !== 'ALL' ? draft.status : undefined,
      service: draft.service !== 'ALL' ? draft.service : undefined,
      governorate: draft.governorate !== 'ALL' ? draft.governorate : undefined,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    const next = defaultDraft();
    setDraft(next);
    updateSearch({
      from: next.dateFrom,
      to: next.dateTo,
      search: undefined,
      status: undefined,
      service: undefined,
      governorate: undefined,
      page: 1,
    });
  };

  const handleSortChange = (key: PositionSortKey) => {
    updateSearch({
      sortBy: key,
      sortDirection: sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    });
  };

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    toast.success('Identifiant copie', { description: value });
  };

  const handleDelete = async () => {
    if (!toDelete) {
      return;
    }

    setDeleteConfirmLoading(true);
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success('Position supprimee', { description: toDelete.barcode });
      setToDelete(null);
    } catch (error) {
      toast.error(mapDeleteError(error));
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const currentSort: PositionSort = { key: sortBy, direction: sortDirection };
  const showEmptyAll =
    !isLoading &&
    !isError &&
    filteredItems.length === 0 &&
    !search.search &&
    !search.status &&
    !search.service &&
    !search.governorate;
  const showEmptyFiltered =
    !isLoading &&
    !isError &&
    filteredItems.length === 0 &&
    Boolean(search.search || search.status || search.service || search.governorate);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <PositionsHeader onRefresh={() => void refetch()} refreshing={isFetching} />
        <PositionsSummary summary={summary} loading={isLoading} />
        <PositionsFilters
          value={draft}
          onChange={setDraft}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          resultCount={filteredItems.length}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} position{filteredItems.length > 1 ? 's' : ''} affichee
            {filteredItems.length > 1 ? 's' : ''}
          </p>
          <PositionsExportMenu
            onCopy={async () => {
              await copyPositionsCsv(paginatedItems);
              toast.success('Positions copiees dans le presse-papiers');
            }}
            onCsv={() => exportPositionsCsv(paginatedItems)}
            onExcel={() => exportPositionsCsv(paginatedItems, 'positions-abm.xls')}
            onPrint={printPositions}
          />
        </div>

        {isLoading ? (
          <>
            <div className="hidden md:block">
              <LoadingSkeleton variant="table" count={8} />
            </div>
            <div className="space-y-4 md:hidden">
              <LoadingSkeleton variant="card" count={4} />
            </div>
          </>
        ) : isError ? (
          <ErrorState message="Impossible de charger les positions ABM." onRetry={() => void refetch()} />
        ) : showEmptyAll ? (
          <EmptyState
            title="Aucune position trouvee pour cette periode"
            description="Aucune expedition n'a ete creee pour la periode selectionnee."
            action={
              <Button asChild>
                <Link to="/admin/positions/nouvelle">Nouvelle position</Link>
              </Button>
            }
          />
        ) : showEmptyFiltered ? (
          <EmptyState
            title="Aucune position correspondante"
            description="Aucune position ne correspond aux filtres selectionnes."
            action={
              <Button variant="outline" onClick={handleResetFilters}>
                Reinitialiser les filtres
              </Button>
            }
          />
        ) : (
          <>
            <PositionsTable
              positions={paginatedItems}
              sort={currentSort}
              onSortChange={handleSortChange}
              expandedId={expandedId}
              onToggleExpand={(id) => setExpandedId((previous) => (previous === id ? null : id))}
              onCopy={handleCopy}
              onView={(position) =>
                void navigate({
                  to: '/admin/positions/$positionId',
                  params: { positionId: position.id },
                  search: {
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
                  },
                })
              }
              onEdit={(position) =>
                toast.info(`Modification de ${position.barcode}`, {
                  description: 'Bientot disponible.',
                })
              }
              onDelete={(position) => setToDelete(position)}
            />

            <div className="space-y-4 md:hidden">
              {paginatedItems.map((position) => (
                <PositionMobileCard
                  key={position.id}
                  position={position}
                  expanded={expandedId === position.id}
                  onToggle={() =>
                    setExpandedId((previous) => (previous === position.id ? null : position.id))
                  }
                  onCopy={handleCopy}
                  onView={() =>
                    void navigate({
                      to: '/admin/positions/$positionId',
                      params: { positionId: position.id },
                      search: {
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
                      },
                    })
                  }
                  onEdit={() =>
                    toast.info(`Modification de ${position.barcode}`, {
                      description: 'Bientot disponible.',
                    })
                  }
                  onDelete={() => setToDelete(position)}
                />
              ))}
            </div>

            <PositionsPagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={(page) => updateSearch({ page })}
              onPageSizeChange={(pageSize) => updateSearch({ pageSize, page: 1 })}
            />
          </>
        )}

        <ConfirmDialog
          open={toDelete !== null}
          onOpenChange={(open) => !open && setToDelete(null)}
          title="Supprimer cette position ?"
          description={`Cette action ne pourra pas etre annulee. La position ${toDelete?.barcode ?? ''} sera definitivement supprimee.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          destructive
          disabled={deleteConfirmLoading}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </TooltipProvider>
  );
}
