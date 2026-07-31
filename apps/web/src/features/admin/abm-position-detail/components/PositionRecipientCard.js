import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy, Mail, MapPinned, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatOptionalText } from '../lib/position-detail-formatters';
async function copyValue(value, label) {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copié`, { description: value });
    }
    catch {
        toast.error(`Impossible de copier ${label.toLowerCase()}.`);
    }
}
export function PositionRecipientCard({ position }) {
    const recipient = position.recipient;
    const address = position.destination.address ??
        [position.destination.city, position.destination.locality, position.destination.postalCode]
            .filter(Boolean)
            .join(', ');
    return (_jsxs("div", { className: "surface-card rounded-3xl p-6", children: [_jsx("div", { className: "mb-5", children: _jsx("h2", { className: "font-display text-2xl font-semibold", children: "Destinataire" }) }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsx(Field, { icon: UserRound, label: "Nom complet", value: formatOptionalText(recipient?.fullName) }), _jsx(ActionField, { icon: Phone, label: "T\u00E9l\u00E9phone", value: formatOptionalText(recipient?.phone), ...(recipient?.phone
                            ? { onCopy: () => void copyValue(recipient.phone, 'Téléphone') }
                            : {}) }), _jsx(ActionField, { icon: Mail, label: "Email", value: formatOptionalText(recipient?.email), ...(recipient?.email ? { onCopy: () => void copyValue(recipient.email, 'Email') } : {}) }), _jsx(Field, { icon: MapPinned, label: "Adresse", value: formatOptionalText(address) }), _jsx(Field, { label: "Gouvernorat", value: formatOptionalText(position.destination.governorate) }), _jsx(Field, { label: "Ville", value: formatOptionalText(position.destination.city) }), _jsx(Field, { label: "Localit\u00E9", value: formatOptionalText(position.destination.locality) }), _jsx(Field, { label: "Code postal", value: formatOptionalText(position.destination.postalCode) })] })] }));
}
function Field({ label, value, icon: Icon, }) {
    return (_jsxs("div", { className: "rounded-2xl border border-border/70 bg-secondary/40 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground", children: [Icon ? _jsx(Icon, { className: "size-4" }) : null, _jsx("span", { children: label })] }), _jsx("p", { className: "mt-3 text-sm font-medium", children: value })] }));
}
function ActionField({ label, value, onCopy, icon: Icon, }) {
    return (_jsxs("div", { className: "rounded-2xl border border-border/70 bg-secondary/40 p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground", children: [_jsx(Icon, { className: "size-4" }), _jsx("span", { children: label })] }), onCopy ? (_jsx(Button, { variant: "ghost", size: "icon", onClick: onCopy, "aria-label": `Copier ${label.toLowerCase()}`, children: _jsx(Copy, { className: "size-4" }) })) : null] }), _jsx("p", { className: "mt-3 text-sm font-medium", children: value })] }));
}
