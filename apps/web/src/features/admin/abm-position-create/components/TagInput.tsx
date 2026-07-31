import { useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TagInput({
  value,
  onChange,
  placeholder = 'Ajouter un contenu puis Entrer',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
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

  return (
    <div className="space-y-3">
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
      {value.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 rounded-full"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                aria-label={`Supprimer ${tag}`}
              >
                <X className="size-3" />
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
