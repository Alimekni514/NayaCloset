import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogOut, Package } from 'lucide-react';

import { AuthGuard, useCurrentUser, useLogout } from '@/features/auth';
import { useCustomerOrders } from '@/features/shared/queries';
import { formatTND } from '@/lib/format';

import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/compte/')({
  head: () => ({
    meta: [
      { title: 'Mon compte - Dar Souk' },
      {
        name: 'description',
        content: 'Gerez vos informations personnelles et consultez vos commandes.',
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const logout = useLogout();
  const { data: orders } = useCustomerOrders(user?.id ?? '');
  const spent = orders?.reduce((sum, order) => sum + order.total, 0) ?? 0;

  return (
    <StoreLayout>
      <AuthGuard>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Mon compte</h1>

          <div className="mt-8 space-y-6">
            <section className="surface-card p-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await logout.mutateAsync().catch(() => undefined);
                    navigate({ to: '/' });
                  }}
                >
                  <LogOut className="size-4" />
                  Deconnexion
                </Button>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface-card p-6">
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="mt-1 font-display text-2xl font-semibold">{orders?.length ?? 0}</p>
              </div>
              <div className="surface-card p-6">
                <p className="text-sm text-muted-foreground">Total depense</p>
                <p className="mt-1 font-display text-2xl font-semibold">{formatTND(spent)}</p>
              </div>
            </div>

            <Button asChild size="lg">
              <Link to="/compte/commandes">
                <Package className="size-4" />
                Voir mes commandes
              </Link>
            </Button>
          </div>
        </div>
      </AuthGuard>
    </StoreLayout>
  );
}
