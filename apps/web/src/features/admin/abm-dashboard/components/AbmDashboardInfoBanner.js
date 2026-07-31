import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Info } from 'lucide-react';
export const AbmDashboardInfoBanner = ({ from, to, filtered, }) => (_jsx("div", { className: "rounded-3xl border border-primary/15 bg-primary/5 px-5 py-4 shadow-soft", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary", children: _jsx(Info, { className: "size-5" }) }), _jsx("p", { className: "text-sm text-foreground", children: filtered && from && to
                    ? `Les donnees affichees sont filtrees du ${from} au ${to}, sauf les indicateurs marques "Non filtre par periode".`
                    : "Les donnees affichees couvrent l'ensemble des donnees disponibles." })] }) }));
