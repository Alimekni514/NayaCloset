import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCheckoutCities, useCheckoutGovernorates, useCheckoutLocalities, useCheckoutPostalCode, useCreateGuestOrder, } from '@/features/checkout/hooks/use-create-guest-order';
import { guestCheckoutSchema } from '@/features/checkout/schemas/guest-checkout.schema';
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
    const [success, setSuccess] = useState(null);
    const createGuestOrder = useCreateGuestOrder();
    const form = useForm({
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
    const normalizedItems = useMemo(() => lines.map(({ product, quantity }) => ({ productId: product.id, quantity })), [lines]);
    const onSubmit = (values) => {
        const idempotencyKey = typeof window !== 'undefined' && 'crypto' in window && typeof window.crypto.randomUUID === 'function'
            ? window.crypto.randomUUID()
            : `${Date.now()}`;
        createGuestOrder.mutate({
            items: normalizedItems,
            delivery: values,
            idempotencyKey,
        }, {
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
        });
    };
    if (!success && cart.length > 0 && (isLoading || (lines.length === 0 && !error))) {
        return (_jsx(StoreLayout, { children: _jsx("div", { className: "mx-auto max-w-7xl px-4 py-10 sm:px-6", children: _jsx(LoadingSkeleton, { count: 3 }) }) }));
    }
    if (lines.length === 0 && !success) {
        return (_jsx(StoreLayout, { children: _jsx("div", { className: "mx-auto max-w-4xl px-4 py-16 sm:px-6", children: _jsx(EmptyState, { title: "Votre panier est vide", description: "Ajoutez des articles avant de passer a la commande.", action: _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/produits", children: "Voir le catalogue" }) }) }) }) }));
    }
    if (success) {
        return (_jsx(StoreLayout, { children: _jsx("div", { className: "mx-auto max-w-3xl px-4 py-16 sm:px-6", children: _jsxs("div", { className: "surface-card space-y-6 p-8 text-center", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.2em] text-primary", children: "Commande enregistree" }), _jsxs("h1", { className: "font-display text-3xl font-semibold", children: ["Reference ", success.reference] }), _jsx("p", { className: "text-muted-foreground", children: "Votre commande a ete enregistree et sera verifiee avant son expedition." }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Total indicatif: ", _jsx("span", { className: "font-medium text-foreground", children: formatMillimesTnd(success.totalMillimes) })] }), _jsxs("div", { className: "flex justify-center gap-3", children: [_jsx(Button, { asChild: true, children: _jsx(Link, { to: "/produits", children: "Continuer vos achats" }) }), _jsx(Button, { asChild: true, variant: "outline", children: _jsx(Link, { to: "/", children: "Retour a l\u2019accueil" }) })] })] }) }) }));
    }
    return (_jsx(StoreLayout, { children: _jsxs("div", { className: "mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_360px] sm:px-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold sm:text-4xl", children: "Finaliser la commande" }), _jsx("p", { className: "mt-2 text-muted-foreground", children: "Commande invitee avec paiement a la livraison. Aucun compte n\u2019est requis." })] }), _jsx(Form, { ...form, children: _jsxs("form", { className: "space-y-6", onSubmit: form.handleSubmit(onSubmit), children: [_jsxs("section", { className: "surface-card space-y-4 p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold", children: "Livraison" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(FormField, { control: form.control, name: "contactLastName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Nom du contact *" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Mekni" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "contactFirstName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Prenom" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ali" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "addressLine1", render: ({ field }) => (_jsxs(FormItem, { className: "sm:col-span-2", children: [_jsx(FormLabel, { children: "Adresse *" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "34 rue 6458" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "addressLine2", render: ({ field }) => (_jsxs(FormItem, { className: "sm:col-span-2", children: [_jsx(FormLabel, { children: "Complement d\u2019adresse" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Appartement, etage, repere" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "governorateId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Gouvernorat *" }), _jsxs(Select, { value: field.value, onValueChange: (value) => {
                                                                        field.onChange(value);
                                                                        form.setValue('cityId', '');
                                                                        form.setValue('localityId', '');
                                                                        form.setValue('postalCode', '');
                                                                    }, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choisir" }) }) }), _jsx(SelectContent, { children: (governoratesQuery.data ?? []).map((item) => (_jsx(SelectItem, { value: item.id, children: item.label }, item.id))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "cityId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Ville *" }), _jsxs(Select, { value: field.value, disabled: !governorateId, onValueChange: (value) => {
                                                                        field.onChange(value);
                                                                        form.setValue('localityId', '');
                                                                        form.setValue('postalCode', '');
                                                                    }, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choisir" }) }) }), _jsx(SelectContent, { children: (citiesQuery.data ?? []).map((item) => (_jsx(SelectItem, { value: item.id, children: item.label }, item.id))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "localityId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Cite / localite *" }), _jsxs(Select, { value: field.value, disabled: !cityId, onValueChange: field.onChange, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choisir" }) }) }), _jsx(SelectContent, { children: (localitiesQuery.data ?? []).map((item) => (_jsx(SelectItem, { value: item.id, children: item.label }, item.id))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "postalCode", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Code postal *" }), _jsx(FormControl, { children: _jsx(Input, { ...field, inputMode: "numeric", maxLength: 4, onChange: (event) => field.onChange(event.target.value.replace(/[^\d]/gu, '').slice(0, 4)) }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "mobile", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Mobile *" }), _jsx(FormControl, { children: _jsx(Input, { ...field, inputMode: "tel", maxLength: 8, placeholder: "20857773", onChange: (event) => field.onChange(event.target.value.replace(/[^\d]/gu, '').slice(0, 8)) }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Telephone" }), _jsx(FormControl, { children: _jsx(Input, { ...field, inputMode: "tel", maxLength: 8, placeholder: "71222444", onChange: (event) => field.onChange(event.target.value.replace(/[^\d]/gu, '').slice(0, 8)) }) }), _jsx(FormMessage, {})] })) })] })] }), _jsx(Button, { type: "submit", size: "lg", disabled: createGuestOrder.isPending, children: createGuestOrder.isPending ? 'Envoi en cours...' : 'Confirmer la commande' })] }) })] }), _jsxs("aside", { className: "surface-card h-fit space-y-4 p-6 lg:sticky lg:top-28", children: [_jsx("h2", { className: "font-display text-xl font-semibold", children: "Votre commande" }), _jsx("ul", { className: "space-y-3", children: lines.map(({ product, quantity }) => (_jsxs("li", { className: "flex items-center gap-3", children: [_jsx("img", { src: product.images[0], alt: "", className: "size-14 rounded-2xl object-cover" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-sm font-medium", children: product.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Quantite : ", quantity] })] }), _jsx("p", { className: "text-sm font-semibold", children: formatTND(product.price * quantity) })] }, product.id))) }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Sous-total" }), _jsx("span", { children: formatTND(subtotal) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Frais de livraison" }), _jsx("span", { children: formatTND(shippingFee) })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex justify-between text-base font-semibold", children: [_jsx("span", { children: "Total" }), _jsx("span", { children: formatTND(total) })] })] })] })] }) }));
}
