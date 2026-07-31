import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export const AbmDashboardFilters = ({ initialFrom, initialTo, onApply, onReset, disabled, }) => {
    const [from, setFrom] = useState(initialFrom);
    const [to, setTo] = useState(initialTo);
    const [error, setError] = useState(null);
    useEffect(() => {
        setFrom(initialFrom);
        setTo(initialTo);
    }, [initialFrom, initialTo]);
    const handleApply = () => {
        if (!from && !to) {
            setError(null);
            onReset();
            return;
        }
        if (!from || !to) {
            setError('Veuillez renseigner les deux dates.');
            return;
        }
        if (from > to) {
            setError('La date de debut doit preceder la date de fin.');
            return;
        }
        setError(null);
        onApply({ from, to });
    };
    return (_jsxs("div", { className: "surface-card p-5", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "abm-from", className: "text-sm font-medium", children: "Du" }), _jsx(Input, { id: "abm-from", type: "date", value: from, max: to || undefined, onChange: (event) => setFrom(event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "abm-to", className: "text-sm font-medium", children: "Au" }), _jsx(Input, { id: "abm-to", type: "date", value: to, min: from || undefined, onChange: (event) => setTo(event.target.value) })] }), _jsx(Button, { type: "button", size: "lg", onClick: handleApply, disabled: disabled, children: "Appliquer" }), _jsx(Button, { type: "button", variant: "outline", size: "lg", onClick: () => {
                            setFrom('');
                            setTo('');
                            setError(null);
                            onReset();
                        }, disabled: disabled, children: "Voir tout" })] }), error ? _jsx("p", { className: "mt-3 text-sm font-medium text-destructive", children: error }) : null] }));
};
