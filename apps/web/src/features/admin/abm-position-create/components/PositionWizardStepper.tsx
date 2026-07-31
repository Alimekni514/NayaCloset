import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const labels = ['Enlevement', 'Livraison', 'Colis', 'Service'] as const;

export function PositionWizardStepper({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: number[];
}) {
  return (
    <ol className="grid gap-3 md:grid-cols-4">
      {labels.map((label, index) => {
        const active = currentStep === index;
        const complete = completedSteps.includes(index);

        return (
          <li
            key={label}
            className={cn(
              'rounded-3xl border px-4 py-4 transition-colors',
              active && 'border-primary bg-primary text-primary-foreground shadow-soft',
              !active && complete && 'border-primary/20 bg-primary/5 text-foreground',
              !active && !complete && 'border-border bg-background text-muted-foreground',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold',
                  active && 'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground',
                  !active && complete && 'border-primary/20 bg-primary text-primary-foreground',
                  !active && !complete && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {complete ? <Check className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">Etape {index + 1} sur 4</p>
                <p className="truncate font-medium">{label}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
