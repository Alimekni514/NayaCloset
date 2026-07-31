import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmer", cancelLabel = "Annuler", destructive, disabled, onConfirm, children, }) {
    return (_jsx(AlertDialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: title }), description ? _jsx(AlertDialogDescription, { children: description }) : null] }), children, _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: cancelLabel }), _jsx(AlertDialogAction, { disabled: disabled, onClick: (event) => {
                                event.preventDefault();
                                onConfirm();
                            }, className: destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined, children: confirmLabel })] })] }) }));
}
