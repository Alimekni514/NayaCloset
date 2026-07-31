import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import {
  Boxes,
  CirclePlus,
  ClipboardPlus,
  ClipboardList,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminGuard, useCurrentUser, useLogout } from '@/features/auth';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

const navItems = [
  { label: 'Tableau de bord ABM', to: '/admin', icon: LayoutDashboard, exact: true, available: true },
  {
    label: 'Mes positions',
    icon: Boxes,
    children: [
      {
        label: 'Nouvelle position',
        icon: CirclePlus,
        children: [
          {
            label: 'Création normale',
            to: '/admin/positions/nouvelle',
            icon: ClipboardPlus,
            available: true,
          },
          {
            label: 'Création simple',
            icon: ClipboardPlus,
            available: false,
          },
        ],
      },
      {
        label: 'Liste des positions',
        to: '/admin/positions',
        icon: List,
        available: true,
      },
    ],
  },
  { label: 'Commandes', to: '/admin/commandes', icon: ClipboardList, available: true },
] as const;

function AdminLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const { user } = useCurrentUser();
  const [positionsOpen, setPositionsOpen] = useState(location.pathname.startsWith('/admin/positions'));

  const pageTitle = useMemo(() => {
    if (location.pathname === '/admin/positions/nouvelle') {
      return 'Nouvelle position';
    }
    if (location.pathname === '/admin/commandes/' || location.pathname === '/admin/commandes') {
      return 'Commandes';
    }
    if (location.pathname.startsWith('/admin/positions/') && location.pathname !== '/admin/positions/') {
      return 'Détail position';
    }
    if (location.pathname === '/admin/positions/' || location.pathname === '/admin/positions') {
      return 'Mes positions';
    }

    const current = navItems.find((item) => 'to' in item && item.to === location.pathname);
    return current?.label ?? 'Administration';
  }, [location.pathname]);

  return (
    <AdminGuard redirect="/admin">
      <div className="flex min-h-screen bg-secondary/40">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#1f4c46] text-white md:flex md:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="font-display text-2xl font-semibold">Dar Souk</p>
            <p className="mt-1 text-sm text-white/70">Administration</p>
          </div>
          <nav className="flex-1 px-4 py-5">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  {'children' in item ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setPositionsOpen((value) => !value)}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                      </button>
                      {positionsOpen ? (
                        <div className="space-y-2 pl-4">
                          {item.children.map((child) => (
                            <div key={child.label} className="space-y-2">
                              {'children' in child ? (
                                <>
                                  <div className="flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium text-white/60">
                                    <child.icon className="size-4" />
                                    <span>{child.label}</span>
                                  </div>
                                  <div className="space-y-2 pl-4">
                                    {child.children.map((grandChild) =>
                                      grandChild.available ? (
                                        <Link
                                          key={grandChild.label}
                                          to={grandChild.to}
                                          activeOptions={{ exact: true }}
                                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                                          activeProps={{ className: 'bg-white/14 text-white' }}
                                        >
                                          <grandChild.icon className="size-4" />
                                          <span>{grandChild.label}</span>
                                        </Link>
                                      ) : (
                                        <div
                                          key={grandChild.label}
                                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45"
                                        >
                                          <grandChild.icon className="size-4" />
                                          <span className="flex-1">{grandChild.label}</span>
                                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                                            Bientot
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </>
                              ) : child.available && 'to' in child ? (
                                <Link
                                  to={child.to as '/admin/positions' | '/admin/positions/nouvelle'}
                                  activeOptions={{ exact: true }}
                                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                                  activeProps={{ className: 'bg-white/14 text-white' }}
                                >
                                  <child.icon className="size-4" />
                                  <span>{child.label}</span>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45">
                                  <child.icon className="size-4" />
                                  <span className="flex-1">{child.label}</span>
                                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                                    Bientot
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : item.available ? (
                    <Link
                      to={item.to}
                      activeOptions={{ exact: 'exact' in item ? item.exact : false }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                      activeProps={{ className: 'bg-white/14 text-white' }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45">
                      <item.icon className="size-4" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                        Bientot
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3 border-t border-white/10 px-4 py-4">
            <Button asChild variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white">
              <Link to="/">
                <Store className="size-4" />
                Retour boutique
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
              onClick={async () => {
                await logout.mutateAsync().catch(() => undefined);
                window.location.href = '/';
              }}
            >
              <LogOut className="size-4" />
              Deconnexion
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu admin">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-[#1f4c46] p-0 text-white">
                  <SheetTitle className="sr-only">Navigation administration</SheetTitle>
                  <div className="border-b border-white/10 px-6 py-6">
                    <p className="font-display text-2xl font-semibold">Dar Souk</p>
                    <p className="mt-1 text-sm text-white/70">Administration</p>
                  </div>
                  <nav className="px-4 py-5">
                    <ul className="space-y-2">
                      {navItems.map((item) => (
                        <li key={item.label}>
                          {'children' in item ? (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => setPositionsOpen((value) => !value)}
                                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                              >
                                <item.icon className="size-4" />
                                <span>{item.label}</span>
                              </button>
                              {positionsOpen ? (
                                <div className="space-y-2 pl-4">
                                  {item.children.map((child) => (
                                    <div key={child.label} className="space-y-2">
                                      {'children' in child ? (
                                        <>
                                          <div className="flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium text-white/60">
                                            <child.icon className="size-4" />
                                            <span>{child.label}</span>
                                          </div>
                                          <div className="space-y-2 pl-4">
                                            {child.children.map((grandChild) =>
                                              grandChild.available ? (
                                                <Link
                                                  key={grandChild.label}
                                                  to={grandChild.to}
                                                  onClick={() => setOpen(false)}
                                                  activeOptions={{ exact: true }}
                                                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                                                  activeProps={{ className: 'bg-white/14 text-white' }}
                                                >
                                                  <grandChild.icon className="size-4" />
                                                  <span>{grandChild.label}</span>
                                                </Link>
                                              ) : (
                                                <div
                                                  key={grandChild.label}
                                                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45"
                                                >
                                                  <grandChild.icon className="size-4" />
                                                  <span>{grandChild.label}</span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </>
                                      ) : child.available && 'to' in child ? (
                                        <Link
                                          to={child.to as '/admin/positions' | '/admin/positions/nouvelle'}
                                          onClick={() => setOpen(false)}
                                          activeOptions={{ exact: true }}
                                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                                          activeProps={{ className: 'bg-white/14 text-white' }}
                                        >
                                          <child.icon className="size-4" />
                                          <span>{child.label}</span>
                                        </Link>
                                      ) : (
                                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45">
                                          <child.icon className="size-4" />
                                          <span>{child.label}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : item.available ? (
                            <Link
                              to={item.to}
                              onClick={() => setOpen(false)}
                              activeOptions={{ exact: 'exact' in item ? item.exact : false }}
                              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                              activeProps={{ className: 'bg-white/14 text-white' }}
                            >
                              <item.icon className="size-4" />
                              <span>{item.label}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45">
                              <item.icon className="size-4" />
                              <span>{item.label}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espace admin</p>
                <p className="truncate font-display text-lg font-semibold">{pageTitle}</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-soft sm:flex">
                <ShieldCheck className="size-4 text-primary" />
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
