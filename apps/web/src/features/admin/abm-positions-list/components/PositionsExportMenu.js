import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy, Download, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
export function PositionsExportMenu({ onCopy, onCsv, onExcel, onPrint }) {
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", id: "positions-export-btn", children: [_jsx(Download, { className: "size-4" }), "Exporter"] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-44", children: [_jsxs(DropdownMenuItem, { onSelect: onCopy, children: [_jsx(Copy, { className: "size-4" }), "Copier"] }), _jsxs(DropdownMenuItem, { onSelect: onCsv, children: [_jsx(FileText, { className: "size-4" }), "CSV"] }), _jsxs(DropdownMenuItem, { onSelect: onExcel, children: [_jsx(FileText, { className: "size-4" }), "Excel (CSV)"] }), _jsxs(DropdownMenuItem, { onSelect: onPrint, children: [_jsx(Printer, { className: "size-4" }), "Imprimer"] })] })] }));
}
