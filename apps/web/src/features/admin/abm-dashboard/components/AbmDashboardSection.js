import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AbmDashboardEventCard } from './AbmDashboardEventCard';
import { defaultEventPresentation, eventPresentationMap, expectedGroupEventIds, } from '../lib/event-presentation';
const sectionTitles = {
    POSITION: 'Position',
    RETOUR: 'Retour',
    ECHANGE: 'Echange',
};
export const AbmDashboardSection = ({ group, events, filtered, }) => {
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
        .filter((event) => !expectedGroupEventIds[group].includes(event.eventId))
        .map((event) => ({
        eventId: event.eventId,
        label: event.label,
        count: event.count,
        hasDate: event.hasDate,
        presentation: defaultEventPresentation,
    }))
        .sort((left, right) => left.eventId - right.eventId);
    const cards = [...expected, ...unknown];
    return (_jsxs("section", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-display text-2xl font-semibold", children: sectionTitles[group] }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Indicateurs operationnels transmis par ABM." })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: cards.map((card) => (_jsx(AbmDashboardEventCard, { count: card.count, label: card.label, hasDate: card.hasDate, filtered: filtered, presentation: card.presentation }, `${group}-${card.eventId}`))) })] }));
};
