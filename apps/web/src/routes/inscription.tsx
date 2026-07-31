import { registerSchema } from '@delivery-commerce/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { useCurrentUser, useRegister } from '@/features/auth';
import { apiErrorUtils } from '@/lib/api-client';

import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { defaultRouteForRole } from './connexion';

export const Route = createFileRoute('/inscription')({
  head: () => ({
    meta: [
      { title: 'Creer un compte - Dar Souk' },
      {
        name: 'description',
        content: 'Creez votre compte client pour commander et suivre vos livraisons.',
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    firstName: registerSchema.shape.firstName,
    lastName: registerSchema.shape.lastName,
    email: registerSchema.shape.email,
    password: registerSchema.shape.password,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const { isAuthenticated, user } = useCurrentUser();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirm: '' },
  });

  if (isAuthenticated) {
    return <Navigate to={defaultRouteForRole(user?.role)} replace />;
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Creer un compte</h1>
        <p className="mt-2 text-muted-foreground">
          Suivez vos commandes et gagnez du temps au moment du paiement.
        </p>

        <Form {...form}>
          <form
            className="surface-card mt-8 grid gap-5 p-6 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) =>
              register.mutate(
                {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  password: values.password,
                },
                {
                  onSuccess: () => {
                    toast.success('Compte cree');
                    navigate({ to: '/connexion', search: { redirect: '/compte' } });
                  },
                  onError: (error) => {
                    const description = apiErrorUtils.isApiError(error)
                      ? error.status === 409
                        ? 'Cette adresse e-mail est deja utilisee.'
                        : error.status === 429
                          ? 'Trop de tentatives. Reessayez dans quelques minutes.'
                          : error.message
                      : 'Inscription impossible';

                    toast.error('Inscription impossible', { description });
                  },
                },
              ),
            )}
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prenom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {register.isError ? (
              <p className="sm:col-span-2 text-sm font-medium text-destructive">
                {apiErrorUtils.isApiError(register.error) && register.error.status === 429
                  ? 'Trop de tentatives. Reessayez dans quelques minutes.'
                  : 'Inscription impossible'}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="sm:col-span-2" disabled={register.isPending}>
              {register.isPending ? 'Creation…' : 'Creer mon compte'}
            </Button>
            <p className="text-center text-sm text-muted-foreground sm:col-span-2">
              Deja client ?{' '}
              <Link to="/connexion" search={{ redirect: undefined }} className="font-semibold text-primary">
                Se connecter
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </StoreLayout>
  );
}
