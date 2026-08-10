# Tasks

## 1. Scaffold

- [x] 1.1 `ng new` the Angular app inside this folder (standalone, zoneless/Signals, routing, Tailwind wired up) — Angular 21.2, verified `ng build` and dev server both work
- [x] 1.2 Set up Vitest (replace default Jasmine/Karma test runner) — native `--test-runner=vitest`, verified `ng test` passes
- [x] 1.3 Confirm `tsconfig` has `strict: true` (per global CLAUDE.md) — confirmed
- [x] 1.4 Wire up ESLint/Prettier (or Angular's default equivalents) so formatting is automatic, not manual — Prettier scaffolded by default (`.prettierrc`); ESLint not yet added, left as a follow-up

## 2. Data model & storage

- [ ] 2.1 Write `models/milestone.model.ts` (Category, Milestone, AchievementRecord, ObservationEntry)
- [ ] 2.2 Write `StorageService` (localStorage read/write, namespaced + versioned key)
- [ ] 2.3 Unit tests for `StorageService` (Vitest)

## 3. Seed content (placeholder, needs review)

- [ ] 3.1 Draft a small set of example milestones for language/speech/swallowing, each with a `sourceNote` — clearly marked as placeholder pending review by a credible source
- [ ] 3.2 **User review checkpoint**: confirm/replace placeholder content before treating it as real — this step needs the user's domain input, not something to auto-approve

## 4. UI

- [ ] 4.1 `DisclaimerBanner` component (persistent, visible — not a one-time dismissible toast)
- [ ] 4.2 `CategoryList` — major category → sub-item hierarchy
- [ ] 4.3 `MilestoneItem` — checkbox + achievement date picker + suggested activities display
- [ ] 4.4 `ObservationLog` — add/list free-text notes
- [ ] 4.5 Bright/cheerful visual pass (Tailwind theme, color palette, spacing)

## 5. Tests & polish

- [ ] 5.1 Smoke tests for the main components (Vitest)
- [ ] 5.2 Manual pass: does the checklist actually work end-to-end in the browser (check off items, reload page, data persists)?
- [ ] 5.3 Update README "目前狀態" section once this change is functionally complete

## 6. Wrap-up

- [ ] 6.1 Archive this OpenSpec change once done (`openspec/specs/development-checklist/` becomes the settled spec)
- [ ] 6.2 Note follow-up ideas (other domains, cross-device sync) as candidates for a future change, not done here
