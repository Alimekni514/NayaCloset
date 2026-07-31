import { Link } from '@tanstack/react-router';
import { ChevronDown, PackagePlus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PositionsHeader({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Mes positions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez, recherchez et gérez vos expéditions ABM.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={refreshing} id="positions-refresh-btn">
          <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>

        <div className="flex items-stretch">
          <Button asChild className="rounded-r-none">
            <Link to="/admin/positions/nouvelle">
              <PackagePlus className="size-4" />
              Nouvelle position
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-l-none border-l border-primary-foreground/20 px-2"
                aria-label="Autres options de création"
              >
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/admin/positions/nouvelle">Création normale</Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="justify-between">
                Création simple
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                  Bientôt
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
