import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingSkeleton } from "./states";
export function DataTable({ columns, rows, rowKey, isLoading, error, onRowClick, emptyTitle = "Aucun résultat", emptyDescription = "Modifiez vos filtres pour élargir la recherche.", }) {
    if (isLoading)
        return _jsx(LoadingSkeleton, { variant: "table" });
    if (error)
        return _jsx(ErrorState, { message: error?.message });
    if (!rows?.length)
        return _jsx(EmptyState, { title: emptyTitle, description: emptyDescription });
    return (_jsx("div", { className: "surface-card overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsx(TableRow, { className: "hover:bg-transparent", children: columns.map((column) => (_jsx(TableHead, { className: cn("whitespace-nowrap", column.hideOnMobile && "hidden md:table-cell", column.className), children: column.header }, column.key))) }) }), _jsx(TableBody, { children: rows.map((row) => (_jsx(TableRow, { onClick: onRowClick ? () => onRowClick(row) : undefined, className: cn(onRowClick && "cursor-pointer"), children: columns.map((column) => (_jsx(TableCell, { className: cn("py-4", column.hideOnMobile && "hidden md:table-cell", column.className), children: column.cell(row) }, column.key))) }, rowKey(row)))) })] }) }));
}
