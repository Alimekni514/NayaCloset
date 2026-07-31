import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';

export function PositionDetailError({
  message,
  backSearch,
  onRetry,
}: {
  message: string;
  backSearch?: object;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/admin/positions" {...(backSearch ? { search: backSearch } : {})}>
            <ArrowLeft className="size-4" />
            Retour aux positions
          </Link>
        </Button>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        ) : null}
      </div>
      <ErrorState message={message} {...(onRetry ? { onRetry } : {})} />
    </div>
  );
}
