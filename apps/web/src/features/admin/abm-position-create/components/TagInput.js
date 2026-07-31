import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export function TagInput({ value, onChange, placeholder = 'Ajouter un contenu puis Entrer', }) {
    const [draft, setDraft] = useState('');
    const commit = () => {
        const normalized = draft.trim().replace(/,$/u, '');
        if (!normalized) {
            setDraft('');
            return;
        }
        if (!value.includes(normalized)) {
            onChange([...value, normalized]);
        }
        setDraft('');
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { value: draft, placeholder: placeholder, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        commit();
                    }
                }, onBlur: commit }), value.length ? (_jsx("div", { className: "flex flex-wrap gap-2", children: value.map((tag) => (_jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary", children: [tag, _jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "size-5 rounded-full", onClick: () => onChange(value.filter((item) => item !== tag)), "aria-label": `Supprimer ${tag}`, children: _jsx(X, { className: "size-3" }) })] }, tag))) })) : null] }));
}
