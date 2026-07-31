import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    validateSearch: (search) => ({
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
export const sanitizeRedirect = (redirect) => redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined;
export const defaultRouteForRole = (role) => role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin' : '/compte';
export const resolvePostLoginRedirect = ({ redirect, role, }) => {
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
        return _jsx(Navigate, { to: resolvePostLoginRedirect({ redirect: search.redirect, role: user?.role }), replace: true });
    }
    return (_jsx(StoreLayout, { children: _jsxs("div", { className: "mx-auto max-w-md px-4 py-16 sm:px-6", children: [_jsx("h1", { className: "font-display text-3xl font-semibold", children: "Connexion" }), _jsx("p", { className: "mt-2 text-muted-foreground", children: "Heureux de vous revoir." }), _jsx(Form, { ...form, children: _jsxs("form", { className: "surface-card mt-8 space-y-5 p-6", onSubmit: form.handleSubmit((values) => login.mutate(values, {
                            onSuccess: (authenticatedUser) => {
                                toast.success('Connexion reussie');
                                const destination = resolvePostLoginRedirect({
                                    redirect: search.redirect,
                                    role: authenticatedUser.role,
                                });
                                navigate({ to: destination });
                            },
                            onError: () => toast.error('Identifiants incorrects'),
                        })), children: [_jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "E-mail" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: "vous@example.tn", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Mot de passe" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...field }) }), _jsx(FormMessage, {})] })) }), login.isError ? (_jsx("p", { className: "text-sm font-medium text-destructive", children: "Identifiants incorrects" })) : null, _jsx(Button, { type: "submit", size: "lg", className: "w-full", disabled: login.isPending, children: login.isPending ? 'Connexion…' : 'Se connecter' }), _jsxs("p", { className: "text-center text-sm text-muted-foreground", children: ["Pas encore de compte ?", ' ', _jsx(Link, { to: "/inscription", className: "font-semibold text-primary", children: "Creer un compte" })] })] }) })] }) }));
}
