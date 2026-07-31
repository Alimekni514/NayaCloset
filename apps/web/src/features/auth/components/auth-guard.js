import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from '@tanstack/react-router';
import { useCurrentUser } from '../hooks/use-current-user';
const sanitizeRedirect = (redirect) => {
    if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/connexion')) {
        return '/compte';
    }
    return redirect;
};
export const AuthGuard = ({ children }) => {
    const location = useLocation();
    const { state, user } = useCurrentUser();
    if (state === 'loading') {
        return (_jsx("div", { className: "mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6", children: "Chargement du compte..." }));
    }
    if (state !== 'authenticated') {
        return (_jsx(Navigate, { to: "/connexion", search: { redirect: sanitizeRedirect(`${location.pathname}${location.searchStr}`) }, replace: true }));
    }
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        return _jsx(Navigate, { to: "/admin", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
