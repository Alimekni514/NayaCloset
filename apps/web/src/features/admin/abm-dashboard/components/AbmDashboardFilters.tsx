import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const AbmDashboardFilters = ({
  initialFrom,
  initialTo,
  onApply,
  onReset,
  disabled,
}: {
  initialFrom: string;
  initialTo: string;
  onApply: (next: { from: string; to: string }) => void;
  onReset: () => void;
  disabled?: boolean;
}) => {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFrom(initialFrom);
    setTo(initialTo);
  }, [initialFrom, initialTo]);

  const handleApply = () => {
    if (!from && !to) {
      setError(null);
      onReset();
      return;
    }

    if (!from || !to) {
      setError('Veuillez renseigner les deux dates.');
      return;
    }

    if (from > to) {
      setError('La date de debut doit preceder la date de fin.');
      return;
    }

    setError(null);
    onApply({ from, to });
  };

  return (
    <div className="surface-card p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="abm-from" className="text-sm font-medium">
            Du
          </label>
          <Input
            id="abm-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="abm-to" className="text-sm font-medium">
            Au
          </label>
          <Input
            id="abm-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <Button type="button" size="lg" onClick={handleApply} disabled={disabled}>
          Appliquer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            setFrom('');
            setTo('');
            setError(null);
            onReset();
          }}
          disabled={disabled}
        >
          Voir tout
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
};
