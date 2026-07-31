import { Link } from '@tanstack/react-router';
import { Heart, Menu, ShoppingBag, Sparkles, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useCurrentUser } from '@/features/auth';
import { useStore } from '@/features/store/store-context';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { CartDrawer } from './CartDrawer';

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/produits', label: 'Catalogue' },
  { to: '/favoris', label: 'Favoris' },
  { to: '/compte/commandes', label: 'Mes commandes' },
] as const;

export function StoreLayout({ children }: { children: ReactNode }) {
  const { cartCount, setCartOpen, favorites } = useStore();
  const { user } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountPath = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin' : user ? '/compte' : '/connexion';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground">
        Livraison partout en Tunisie - paiement a la livraison disponible
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetTitle className="px-4 pt-4">Navigation</SheetTitle>
                <nav className="mt-4 flex flex-col gap-1 px-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted"
                      activeProps={{ className: 'bg-muted' }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex min-w-0 items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="truncate font-display text-lg font-semibold tracking-tight">Dar Souk</span>
            </Link>
          </div>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: 'bg-muted text-foreground' }}
                activeOptions={{ exact: link.to === '/' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Favoris">
              <Link to="/favoris">
                <Heart className="size-5" />
                {favorites.length > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {favorites.length}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Mon compte">
              <Link to={accountPath} {...(user ? {} : { search: {} })}>
                <User className="size-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Panier, ${cartCount} article(s)`}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-secondary/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold">Dar Souk</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Selection d&apos;objets utiles et bien faits, livres partout en Tunisie sous 48 a 72 heures.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Boutique</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/produits">Catalogue</Link></li>
              <li><Link to="/favoris">Favoris</Link></li>
              <li><Link to="/panier">Panier</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Compte</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/connexion" search={{ redirect: undefined }}>Connexion</Link></li>
              <li><Link to="/inscription">Creer un compte</Link></li>
              <li><Link to="/compte/commandes">Suivi de commande</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Aide</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>contact@darsouk.tn</li>
              <li>+216 71 000 000</li>
              <li>Paiement a la livraison</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
          © 2026 Dar Souk. Tous droits reserves. Prix affiches en TND.
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
