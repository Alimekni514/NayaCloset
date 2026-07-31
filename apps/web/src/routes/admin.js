import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { Boxes, CirclePlus, ClipboardPlus, ClipboardList, LayoutDashboard, List, LogOut, Menu, ShieldCheck, Store, } from 'lucide-react';
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
];
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
    return (_jsx(AdminGuard, { redirect: "/admin", children: _jsxs("div", { className: "flex min-h-screen bg-secondary/40", children: [_jsxs("aside", { className: "hidden w-72 shrink-0 border-r border-white/10 bg-[#1f4c46] text-white md:flex md:flex-col", children: [_jsxs("div", { className: "border-b border-white/10 px-6 py-6", children: [_jsx("p", { className: "font-display text-2xl font-semibold", children: "Dar Souk" }), _jsx("p", { className: "mt-1 text-sm text-white/70", children: "Administration" })] }), _jsx("nav", { className: "flex-1 px-4 py-5", children: _jsx("ul", { className: "space-y-2", children: navItems.map((item) => (_jsx("li", { children: 'children' in item ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", onClick: () => setPositionsOpen((value) => !value), className: "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", children: [_jsx(item.icon, { className: "size-4" }), _jsx("span", { className: "flex-1", children: item.label })] }), positionsOpen ? (_jsx("div", { className: "space-y-2 pl-4", children: item.children.map((child) => (_jsx("div", { className: "space-y-2", children: 'children' in child ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium text-white/60", children: [_jsx(child.icon, { className: "size-4" }), _jsx("span", { children: child.label })] }), _jsx("div", { className: "space-y-2 pl-4", children: child.children.map((grandChild) => grandChild.available ? (_jsxs(Link, { to: grandChild.to, activeOptions: { exact: true }, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", activeProps: { className: 'bg-white/14 text-white' }, children: [_jsx(grandChild.icon, { className: "size-4" }), _jsx("span", { children: grandChild.label })] }, grandChild.label)) : (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45", children: [_jsx(grandChild.icon, { className: "size-4" }), _jsx("span", { className: "flex-1", children: grandChild.label }), _jsx("span", { className: "rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide", children: "Bientot" })] }, grandChild.label))) })] })) : child.available && 'to' in child ? (_jsxs(Link, { to: child.to, activeOptions: { exact: true }, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", activeProps: { className: 'bg-white/14 text-white' }, children: [_jsx(child.icon, { className: "size-4" }), _jsx("span", { children: child.label })] })) : (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45", children: [_jsx(child.icon, { className: "size-4" }), _jsx("span", { className: "flex-1", children: child.label }), _jsx("span", { className: "rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide", children: "Bientot" })] })) }, child.label))) })) : null] })) : item.available ? (_jsxs(Link, { to: item.to, activeOptions: { exact: 'exact' in item ? item.exact : false }, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", activeProps: { className: 'bg-white/14 text-white' }, children: [_jsx(item.icon, { className: "size-4" }), _jsx("span", { children: item.label })] })) : (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45", children: [_jsx(item.icon, { className: "size-4" }), _jsx("span", { className: "flex-1", children: item.label }), _jsx("span", { className: "rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide", children: "Bientot" })] })) }, item.label))) }) }), _jsxs("div", { className: "space-y-3 border-t border-white/10 px-4 py-4", children: [_jsx(Button, { asChild: true, variant: "ghost", className: "w-full justify-start text-white hover:bg-white/10 hover:text-white", children: _jsxs(Link, { to: "/", children: [_jsx(Store, { className: "size-4" }), "Retour boutique"] }) }), _jsxs(Button, { variant: "ghost", className: "w-full justify-start text-white hover:bg-white/10 hover:text-white", onClick: async () => {
                                        await logout.mutateAsync().catch(() => undefined);
                                        window.location.href = '/';
                                    }, children: [_jsx(LogOut, { className: "size-4" }), "Deconnexion"] })] })] }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [_jsx("header", { className: "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur", children: _jsxs("div", { className: "flex h-16 items-center gap-3 px-4 sm:px-6", children: [_jsxs(Sheet, { open: open, onOpenChange: setOpen, children: [_jsx(SheetTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", className: "md:hidden", "aria-label": "Ouvrir le menu admin", children: _jsx(Menu, { className: "size-5" }) }) }), _jsxs(SheetContent, { side: "left", className: "w-72 bg-[#1f4c46] p-0 text-white", children: [_jsx(SheetTitle, { className: "sr-only", children: "Navigation administration" }), _jsxs("div", { className: "border-b border-white/10 px-6 py-6", children: [_jsx("p", { className: "font-display text-2xl font-semibold", children: "Dar Souk" }), _jsx("p", { className: "mt-1 text-sm text-white/70", children: "Administration" })] }), _jsx("nav", { className: "px-4 py-5", children: _jsx("ul", { className: "space-y-2", children: navItems.map((item) => (_jsx("li", { children: 'children' in item ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", onClick: () => setPositionsOpen((value) => !value), className: "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", children: [_jsx(item.icon, { className: "size-4" }), _jsx("span", { children: item.label })] }), positionsOpen ? (_jsx("div", { className: "space-y-2 pl-4", children: item.children.map((child) => (_jsx("div", { className: "space-y-2", children: 'children' in child ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium text-white/60", children: [_jsx(child.icon, { className: "size-4" }), _jsx("span", { children: child.label })] }), _jsx("div", { className: "space-y-2 pl-4", children: child.children.map((grandChild) => grandChild.available ? (_jsxs(Link, { to: grandChild.to, onClick: () => setOpen(false), activeOptions: { exact: true }, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", activeProps: { className: 'bg-white/14 text-white' }, children: [_jsx(grandChild.icon, { className: "size-4" }), _jsx("span", { children: grandChild.label })] }, grandChild.label)) : (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45", children: [_jsx(grandChild.icon, { className: "size-4" }), _jsx("span", { children: grandChild.label })] }, grandChild.label))) })] })) : child.available && 'to' in child ? (_jsxs(Link, { to: child.to, onClick: () => setOpen(false), activeOptions: { exact: true }, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", activeProps: { className: 'bg-white/14 text-white' }, children: [_jsx(child.icon, { className: "size-4" }), _jsx("span", { children: child.label })] })) : (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45", children: [_jsx(child.icon, { className: "size-4" }), _jsx("span", { children: child.label })] })) }, child.label))) })) : null] })) : item.available ? (_jsxs(Link, { to: item.to, onClick: () => setOpen(false), activeOptions: { exact: 'exact' in item ? item.exact : false }, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white", activeProps: { className: 'bg-white/14 text-white' }, children: [_jsx(item.icon, { className: "size-4" }), _jsx("span", { children: item.label })] })) : (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/45", children: [_jsx(item.icon, { className: "size-4" }), _jsx("span", { children: item.label })] })) }, item.label))) }) })] })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Espace admin" }), _jsx("p", { className: "truncate font-display text-lg font-semibold", children: pageTitle })] }), _jsxs("div", { className: "hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-soft sm:flex", children: [_jsx(ShieldCheck, { className: "size-4 text-primary" }), _jsxs("span", { className: "text-sm font-medium", children: [user?.firstName, " ", user?.lastName] })] })] }) }), _jsx("main", { className: "min-w-0 flex-1 px-4 py-6 sm:px-6", children: _jsx(Outlet, {}) })] })] }) }));
}
