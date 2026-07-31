import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Banknote, CircleCheckBig, Package, TriangleAlert } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { formatTND } from '@/lib/format';
export function PositionsSummary({ summary, loading }) {
    const isLoading = loading === true;
    const displayedCount = summary?.total ?? 0;
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(StatCard, { label: "Positions affichees", value: displayedCount, icon: Package, ...(isLoading ? { loading: true } : {}) }), _jsx(StatCard, { label: "Montant COD total", value: summary ? formatTND(summary.totalCod) : '-', icon: Banknote, ...(isLoading ? { loading: true } : {}) }), _jsx(StatCard, { label: "Livrees", value: summary?.delivered ?? 0, icon: CircleCheckBig, tone: "success", ...(isLoading ? { loading: true } : {}) }), _jsx(StatCard, { label: "En anomalie", value: summary?.anomalies ?? 0, icon: TriangleAlert, tone: "danger", ...(isLoading ? { loading: true } : {}) })] }));
}
