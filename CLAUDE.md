# development-milestones — project rules

General habits (commit language, Conventional Commits, strict TypeScript, Vitest, Angular standalone+Signals) live in the global `CLAUDE.md` — this file only adds project-specific rules on top.

## Scope discipline

This is an experiment project for trying Claude Code + Angular. The first OpenSpec change is scoped to **language / speech / swallowing** domains only. Don't silently expand scope to other development domains (motor, cognition, etc.) — that belongs in a later OpenSpec change.

## Content vs. code language

- Code, comments, commit messages: **English** (per global `CLAUDE.md`).
- User-facing app content (labels, milestone descriptions, activity suggestions): **Traditional Chinese (Taiwan usage)** — this app's audience is Chinese-speaking parents/caregivers.

## Health-content caution

Milestone/checklist content is health-adjacent. Don't invent specific developmental ages/thresholds as if authoritative — cite a credible source (WHO, ASHA, Taiwan 衛福部 or equivalent) for any real content, or flag it clearly as a placeholder pending review. The disclaimer ("reference only, not a diagnostic tool") must stay visible in the UI, not buried in the README.

## Stack specifics

- Angular: standalone components + Signals, no NgModules.
- Styling: Tailwind CSS (matches the bright/cheerful visual goal, easiest to theme quickly).
- Storage: a single injectable service wrapping `localStorage`, not scattered direct `localStorage` calls across components.
- Testing: Vitest.

## Workflow

Follow `openspec/changes/*/tasks.md` in order rather than jumping ahead. Update task checkboxes as work completes.
