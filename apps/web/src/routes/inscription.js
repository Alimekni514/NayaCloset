import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { firstName: '', lastName: '', email: '', password: '', confirm: '' },
    });
    if (isAuthenticated) {
        return _jsx(Navigate, { to: defaultRouteForRole(user?.role), replace: true });
    }
    return (_jsx(StoreLayout, { children: _jsxs("div", { className: "mx-auto max-w-lg px-4 py-16 sm:px-6", children: [_jsx("h1", { className: "font-display text-3xl font-semibold", children: "Creer un compte" }), _jsx("p", { className: "mt-2 text-muted-foreground", children: "Suivez vos commandes et gagnez du temps au moment du paiement." }), _jsx(Form, { ...form, children: _jsxs("form", { className: "surface-card mt-8 grid gap-5 p-6 sm:grid-cols-2", onSubmit: form.handleSubmit((values) => register.mutate({
                            firstName: values.firstName,
                            lastName: values.lastName,
                            email: values.email,
                            password: values.password,
                        }, {
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
                        })), children: [_jsx(FormField, { control: form.control, name: "firstName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Prenom" }), _jsx(FormControl, { children: _jsx(Input, { ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "lastName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Nom" }), _jsx(FormControl, { children: _jsx(Input, { ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { className: "sm:col-span-2", children: [_jsx(FormLabel, { children: "E-mail" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Mot de passe" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "confirm", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Confirmation" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", ...field }) }), _jsx(FormMessage, {})] })) }), register.isError ? (_jsx("p", { className: "sm:col-span-2 text-sm font-medium text-destructive", children: apiErrorUtils.isApiError(register.error) && register.error.status === 429
                                    ? 'Trop de tentatives. Reessayez dans quelques minutes.'
                                    : 'Inscription impossible' })) : null, _jsx(Button, { type: "submit", size: "lg", className: "sm:col-span-2", disabled: register.isPending, children: register.isPending ? 'Creation…' : 'Creer mon compte' }), _jsxs("p", { className: "text-center text-sm text-muted-foreground sm:col-span-2", children: ["Deja client ?", ' ', _jsx(Link, { to: "/connexion", search: { redirect: undefined }, className: "font-semibold text-primary", children: "Se connecter" })] })] }) })] }) }));
}
