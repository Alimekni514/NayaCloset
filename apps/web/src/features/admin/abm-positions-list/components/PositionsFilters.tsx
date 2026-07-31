import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ABM_GOVERNORATES, ABM_SERVICES, type PositionsDraftFilters } from '../types/abm-position-list.types';

const STATUS_OPTIONS = [
  { value: 'created', label: 'Créée' },
  { value: 'progress', label: 'En cours' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'anomaly', label: 'Anomalie' },
  { value: 'return', label: 'Retour' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'neutral', label: 'Neutre' },
];

interface Props {
  value: PositionsDraftFilters;
  onChange: (next: PositionsDraftFilters) => void;
  onApply: () => void;
  onReset: () => void;
  resultCount: number;
}

export function PositionsFilters({ value, onChange, onApply, onReset, resultCount }: Props) {
  const set = <K extends keyof PositionsDraftFilters>(key: K, v: PositionsDraftFilters[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <section className="surface-card p-4 sm:p-6" aria-label="Filtres des positions">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        Filtres
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {resultCount} position{resultCount > 1 ? 's' : ''} correspondante{resultCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="positions-date-from">Date du</Label>
          <Input
            id="positions-date-from"
            type="date"
            value={value.dateFrom}
            max={value.dateTo || undefined}
            onChange={(e) => set('dateFrom', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="positions-date-to">Date au</Label>
          <Input
            id="positions-date-to"
            type="date"
            value={value.dateTo}
            min={value.dateFrom || undefined}
            onChange={(e) => set('dateTo', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="positions-search">Recherche générale</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="positions-search"
              className="pl-9"
              placeholder="Référence, identifiant, destinataire ou téléphone"
              value={value.search}
              onChange={(e) => set('search', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="positions-status">Statut</Label>
          <Select value={value.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger id="positions-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="positions-service">Service</Label>
          <Select value={value.service} onValueChange={(v) => set('service', v)}>
            <SelectTrigger id="positions-service">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les services</SelectItem>
              {ABM_SERVICES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="positions-governorate">Gouvernorat</Label>
          <Select value={value.governorate} onValueChange={(v) => set('governorate', v)}>
            <SelectTrigger id="positions-governorate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les gouvernorats</SelectItem>
              {ABM_GOVERNORATES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button id="positions-apply-filters" onClick={onApply}>
          Appliquer les filtres
        </Button>
        <Button id="positions-reset-filters" variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" />
          Réinitialiser
        </Button>
      </div>
    </section>
  );
}
