import { AbmDashboardEventCard } from './AbmDashboardEventCard';
import {
  defaultEventPresentation,
  eventPresentationMap,
  expectedGroupEventIds,
} from '../lib/event-presentation';
import type { AbmDashboardEvent, AbmDashboardGroup } from '../types/abm-dashboard.types';

const sectionTitles: Record<AbmDashboardGroup, string> = {
  POSITION: 'Position',
  RETOUR: 'Retour',
  ECHANGE: 'Echange',
};

export const AbmDashboardSection = ({
  group,
  events,
  filtered,
}: {
  group: AbmDashboardGroup;
  events: AbmDashboardEvent[];
  filtered: boolean;
}) => {
  const existingById = new Map(events.map((event) => [event.eventId, event]));
  const expected = expectedGroupEventIds[group].map((eventId) => {
    const event = existingById.get(eventId);
    const presentation = eventPresentationMap[eventId] ?? defaultEventPresentation;

    return {
      eventId,
      label: event?.label ?? presentation.fallbackLabel,
      count: event?.count ?? 0,
      hasDate: event?.hasDate ?? true,
      presentation,
    };
  });

  const unknown = events
    .filter((event) => !expectedGroupEventIds[group].includes(event.eventId as never))
    .map((event) => ({
      eventId: event.eventId,
      label: event.label,
      count: event.count,
      hasDate: event.hasDate,
      presentation: defaultEventPresentation,
    }))
    .sort((left, right) => left.eventId - right.eventId);

  const cards = [...expected, ...unknown];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">{sectionTitles[group]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicateurs operationnels transmis par ABM.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <AbmDashboardEventCard
            key={`${group}-${card.eventId}`}
            count={card.count}
            label={card.label}
            hasDate={card.hasDate}
            filtered={filtered}
            presentation={card.presentation}
          />
        ))}
      </div>
    </section>
  );
};
