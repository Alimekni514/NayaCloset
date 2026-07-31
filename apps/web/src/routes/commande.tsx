import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  useCheckoutCities,
  useCheckoutGovernorates,
  useCheckoutLocalities,
  useCheckoutPostalCode,
  useCreateGuestOrder,
} from '@/features/checkout/hooks/use-create-guest-order';
import { guestCheckoutSchema, type GuestCheckoutValues } from '@/features/checkout/schemas/guest-checkout.schema';
import { useCurrentUser } from '@/features/auth';
import { useCartDetails } from '@/features/store/use-cart-details';
import { useStore } from '@/features/store/store-context';
import { apiErrorUtils } from '@/lib/api-client';
import { formatMillimesTnd, formatTND } from '@/lib/format';

import { EmptyState, LoadingSkeleton } from '@/components/common/states';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/commande')({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useCurrentUser();
  const { cart, clearCart } = useStore();
  const { lines, subtotal, shippingFee, total, isLoading, error } = useCartDetails();
  const [success, setSuccess] = useState<{ reference: string; totalMillimes: number } | null>(null);
  const createGuestOrder = useCreateGuestOrder();

  const form = useForm<GuestCheckoutValues>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      contactLastName: user?.lastName ?? '',
      contactFirstName: user?.firstName ?? '',
      addressLine1: '',
      addressLine2: '',
      governorateId: '',
      cityId: '',
      localityId: '',
      postalCode: '',
      mobile: '',
      phone: '',
    },
  });

  const governorateId = form.watch('governorateId');
  const cityId = form.watch('cityId');
  const localityId = form.watch('localityId');

  const governoratesQuery = useCheckoutGovernorates();
  const citiesQuery = useCheckoutCities(governorateId);
  const localitiesQuery = useCheckoutLocalities(cityId);
  const postalCodeQuery = useCheckoutPostalCode(localityId);

  useEffect(() => {
    if (postalCodeQuery.data) {
      form.setValue('postalCode', postalCodeQuery.data.replace(/[^\d]/gu, '').slice(0, 4), {
        shouldValidate: true,
      });
    }
  }, [postalCodeQuery.data, form]);

  const normalizedItems = useMemo(
    () =>
      lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        ...(line.selectedColor ? { selectedColor: line.selectedColor } : {}),
        ...(line.selectedSize ? { selectedSize: line.selectedSize } : {}),
      })),
    [lines],
  );

  const onSubmit = (values: GuestCheckoutValues) => {
    const idempotencyKey =
      typeof window !== 'undefined' && 'crypto' in window && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}`;

    createGuestOrder.mutate(
      {
        items: normalizedItems,
        delivery: values,
        idempotencyKey,
      },
      {
        onSuccess: (response) => {
          clearCart();
          setSuccess({
            reference: response.order.reference,
            totalMillimes: response.order.totalMillimes,
          });
        },
        onError: (error) => {
          const message = apiErrorUtils.isApiError(error)
            ? error.message
            : 'Impossible d’enregistrer votre commande. Veuillez reessayer.';
          toast.error(message);
        },
      },
    );
  };

  if (!success && cart.length > 0 && (isLoading || (lines.length === 0 && !error))) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <LoadingSkeleton count={3} />
        </div>
      </StoreLayout>
    );
  }

  if (lines.length === 0 && !success) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Votre panier est vide"
            description="Ajoutez des articles avant de passer a la commande."
            action={
              <Button asChild>
                <Link to="/produits">Voir le catalogue</Link>
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  if (success) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="surface-card space-y-6 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Commande enregistree</p>
            <h1 className="font-display text-3xl font-semibold">Reference {success.reference}</h1>
            <p className="text-muted-foreground">
              Votre commande a ete enregistree et sera verifiee avant son expedition.
            </p>
            <p className="text-sm text-muted-foreground">
              Total indicatif: <span className="font-medium text-foreground">{formatMillimesTnd(success.totalMillimes)}</span>
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link to="/produits">Continuer vos achats</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Retour a l’accueil</Link>
              </Button>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_360px] sm:px-6">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">Finaliser la commande</h1>
            <p className="mt-2 text-muted-foreground">
              Commande invitee avec paiement a la livraison. Aucun compte n’est requis.
            </p>
          </div>

          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <section className="surface-card space-y-4 p-6">
                <h2 className="font-display text-xl font-semibold">Livraison</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contactLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du contact *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mekni" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prenom</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ali" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Adresse *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="34 rue 6458" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Complement d’adresse</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Appartement, etage, repere" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="governorateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gouvernorat *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('cityId', '');
                            form.setValue('localityId', '');
                            form.setValue('postalCode', '');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(governoratesQuery.data ?? []).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <Select
                          value={field.value}
                          disabled={!governorateId}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('localityId', '');
                            form.setValue('postalCode', '');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(citiesQuery.data ?? []).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="localityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cite / localite *</FormLabel>
                        <Select value={field.value} disabled={!cityId} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(localitiesQuery.data ?? []).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            maxLength={4}
                            onChange={(event) => field.onChange(event.target.value.replace(/[^\d]/gu, '').slice(0, 4))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="tel"
                            maxLength={8}
                            placeholder="20857773"
                            onChange={(event) => field.onChange(event.target.value.replace(/[^\d]/gu, '').slice(0, 8))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="tel"
                            maxLength={8}
                            placeholder="71222444"
                            onChange={(event) => field.onChange(event.target.value.replace(/[^\d]/gu, '').slice(0, 8))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <Button type="submit" size="lg" disabled={createGuestOrder.isPending}>
                {createGuestOrder.isPending ? 'Envoi en cours...' : 'Confirmer la commande'}
              </Button>
            </form>
          </Form>
        </div>

        <aside className="surface-card h-fit space-y-4 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-semibold">Votre commande</h2>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.key} className="flex items-center gap-3">
                <img src={line.imageUrl} alt="" className="size-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    {line.selectedColor && <span>{line.selectedColor}</span>}
                    {line.selectedSize && (
                      <span className="rounded bg-secondary px-1 font-medium">{line.selectedSize}</span>
                    )}
                    <span>× {line.quantity}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatTND(line.unitPrice * line.quantity)}</p>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatTND(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frais de livraison</span>
              <span>{formatTND(shippingFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatTND(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </StoreLayout>
  );
}
