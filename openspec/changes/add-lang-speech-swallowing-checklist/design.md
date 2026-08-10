# Design: add-lang-speech-swallowing-checklist

## Architecture

Angular, latest version, **standalone components + Signals** (no NgModules). Rough shape:

```
src/app/
├── core/
│   └── storage/              StorageService — the only thing that touches localStorage
├── features/
│   └── checklist/
│       ├── checklist-page/           top-level route component
│       ├── category-list/            renders major categories
│       ├── milestone-item/           a single sub-item: checkbox, date, activity suggestions
│       └── observation-log/          free-text notes per child
├── models/
│   └── milestone.model.ts    Category, Milestone, AchievementRecord, ObservationEntry types
└── shared/
    └── disclaimer-banner/    the persistent "reference only" notice
```

State is held in Signals inside `StorageService` (or a small store service on top of it) rather than component-local state getting out of sync with what's persisted.

## Data model (sketch)

```ts
interface Milestone {
  id: string;
  categoryId: 'language' | 'speech' | 'swallowing';
  title: string;                 // Traditional Chinese, user-facing
  description?: string;
  typicalAgeRangeMonths?: [number, number];
  suggestedActivities?: string[]; // Traditional Chinese
  sourceNote?: string;            // where this milestone claim comes from — required for real (non-placeholder) content
}

interface AchievementRecord {
  milestoneId: string;
  achievedOnISODate: string;      // when the child hit it
  note?: string;
}

interface ObservationEntry {
  id: string;
  dateISODate: string;
  text: string;                   // free-text parent note, Traditional Chinese
}
```

`sourceNote` exists specifically so we never ship a milestone claim with no traceable origin — see the health-content caution in the project `CLAUDE.md`.

## Storage

One `StorageService`, `localStorage` under a single namespaced key (e.g. `dev-milestones:v1`), JSON-serialized. No IndexedDB needed at this scale. Versioned key so a future schema change doesn't silently corrupt old data — a v2 migration can be a later change if needed.

## Styling

Tailwind CSS. Reasoning: fastest way to hit "bright/cheerful" without hand-rolling a design system, and it's what the reference project already used successfully for a similar goal.

## Testing

Vitest for unit tests (models, `StorageService` logic). Component tests can start minimal (a couple of smoke tests) rather than full coverage — this is an experiment project, not a coverage-driven one.

## Explicitly not doing here

No backend, no auth, no cross-device sync, no i18n framework for multiple UI languages (the whole app is Traditional Chinese content by design, per the project `CLAUDE.md` — code stays English, UI content is Chinese).
