import { loginSchema } from '@delivery-commerce/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCurrentUser, useLogin } from '@/features/auth';

import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/connexion')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Connexion - Dar Souk' },
      {
        name: 'description',
        content: 'Connectez-vous pour suivre vos commandes et accelerer vos achats.',
      },
    ],
  }),
  component: LoginPage,
});

export const sanitizeRedirect = (redirect?: string) =>
  redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined;

export const defaultRouteForRole = (role?: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN') =>
  role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin' : '/compte';

export const resolvePostLoginRedirect = ({
  redirect,
  role,
}: {
  redirect: string | undefined;
  role: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN' | undefined;
}) => {
  const safeRedirect = sanitizeRedirect(redirect);

  if (!safeRedirect) {
    return defaultRouteForRole(role);
  }

  if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && safeRedirect.startsWith('/compte')) {
    return '/admin';
  }

  if (role === 'CLIENT' && safeRedirect.startsWith('/admin')) {
    return '/compte';
  }

  return safeRedirect;
};

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const login = useLogin();
  const { isAuthenticated, user } = useCurrentUser();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to={resolvePostLoginRedirect({ redirect: search.redirect, role: user?.role })} replace />;
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Connexion</h1>
        <p className="mt-2 text-muted-foreground">Heureux de vous revoir.</p>

        <Form {...form}>
          <form
            className="surface-card mt-8 space-y-5 p-6"
            onSubmit={form.handleSubmit((values) =>
              login.mutate(values, {
                onSuccess: (authenticatedUser) => {
                  toast.success('Connexion reussie');
                  const destination = resolvePostLoginRedirect({
                    redirect: search.redirect,
                    role: authenticatedUser.role,
                  });
                  navigate({ to: destination });
                },
                onError: () => toast.error('Identifiants incorrects'),
              }),
            )}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="vous@example.tn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {login.isError ? (
              <p className="text-sm font-medium text-destructive">Identifiants incorrects</p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Connexion…' : 'Se connecter'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="font-semibold text-primary">
                Creer un compte
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </StoreLayout>
  );
}
