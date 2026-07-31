import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from '@tanstack/react-router';
import { useCurrentUser } from '../hooks/use-current-user';
const sanitizeRedirect = (redirect) => {
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
        return '/admin';
    }
    return redirect;
};
export const AdminGuard = ({ children, redirect = '/admin', }) => {
    const { state, user } = useCurrentUser();
    if (state === 'loading') {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: _jsxs("div", { className: "space-y-2 text-center", children: [_jsx("p", { className: "font-display text-2xl font-semibold", children: "Chargement de l'administration" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Verification de votre session et de vos permissions..." })] }) }));
    }
    if (state === 'unauthenticated') {
        return (_jsx(Navigate, { to: "/connexion", search: { redirect: sanitizeRedirect(redirect) }, replace: true }));
    }
    if (state !== 'authenticated' || !user) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: _jsxs("div", { className: "space-y-2 text-center", children: [_jsx("p", { className: "font-display text-2xl font-semibold", children: "Session en cours de verification" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Nous confirmons votre acces a l'administration..." })] }) }));
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
