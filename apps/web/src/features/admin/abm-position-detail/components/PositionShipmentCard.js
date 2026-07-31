import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCod, formatMetric, formatOptionalText } from '../lib/position-detail-formatters';
export function PositionShipmentCard({ position }) {
    const shipment = position.shipment;
    const rows = [
        ['Type', formatOptionalText(shipment.type)],
        ['Service', formatOptionalText(shipment.service)],
        ['Poids', formatMetric(shipment.weightKg, 'kg')],
        ['Nombre de pièces', shipment.pieces == null ? 'Non disponible' : String(shipment.pieces)],
        ['Référence', formatOptionalText(shipment.reference ?? position.reference)],
        ['Valeur déclarée', shipment.declaredValue == null ? 'Non disponible' : formatCod(shipment.declaredValue)],
        ['Contenu', shipment.contents?.length ? shipment.contents.join(', ') : 'Non disponible'],
        ['Montant COD', formatCod(shipment.codAmount)],
        ['Mode de paiement', formatOptionalText(shipment.paymentMode)],
        ['Échange', shipment.exchange == null ? 'Non disponible' : shipment.exchange ? 'Oui' : 'Non'],
        ['Ouverture autorisée', shipment.allowOpen == null ? 'Non disponible' : shipment.allowOpen ? 'Oui' : 'Non'],
    ];
    return (_jsxs("div", { className: "surface-card rounded-3xl p-6", children: [_jsx("div", { className: "mb-5", children: _jsx("h2", { className: "font-display text-2xl font-semibold", children: "Informations du colis" }) }), _jsx("dl", { className: "grid gap-4 sm:grid-cols-2", children: rows.map(([label, value]) => (_jsxs("div", { className: "rounded-2xl border border-border/70 bg-secondary/40 p-4", children: [_jsx("dt", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground", children: label }), _jsx("dd", { className: "mt-3 text-sm font-medium", children: value })] }, label))) })] }));
}
