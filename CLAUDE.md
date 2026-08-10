# development-milestones — project rules

General habits (commit language, Conventional Commits, strict TypeScript, Vitest, Angular standalone+Signals) live in the global `CLAUDE.md` — this file only adds project-specific rules on top.

## Product direction

As of the `add-therapist-rule-engine` change, this app's target audience is **speech-language therapists (語言治療師)**, not parents/caregivers. The earlier parent-facing milestone-checklist concept (`add-lang-speech-swallowing-checklist`) is shelved — don't resurrect its data model (`Milestone`/`AchievementRecord`/`ObservationEntry`) without an explicit new OpenSpec change. The core mechanic is now: therapists author condition→action rules (stored as JsonLogic JSON) that fire warnings/summaries against a case's recorded findings, and help draft report text.

## Scope discipline

This is an experiment project for trying Claude Code + Angular. The first OpenSpec change is scoped to **language / speech / swallowing** domains only. Don't silently expand scope to other clinical domains (motor, cognition, etc.) — that belongs in a later OpenSpec change.

## Content vs. code language

- Code, comments, commit messages: **English** (per global `CLAUDE.md`).
- User-facing app content (labels, finding/rule descriptions, warning and report text): **Traditional Chinese (Taiwan usage)** — this app's audience is Chinese-speaking speech-language therapists.
- OpenSpec docs (`proposal.md`, `design.md`, `tasks.md`, `specs/**/spec.md`): **Traditional Chinese**, prose only — keep OpenSpec's structural keywords (`ADDED Requirements`, `Requirement:`, `Scenario:`, `WHEN`/`THEN`/`AND`, `SHALL`/`SHALL NOT`) in English since the tooling parses on them.

## Health-content caution

Finding/rule content is health-adjacent. Sample findings and rules are placeholders until a therapist reviews and replaces them — don't ship them as if they were validated clinical logic. A rule's `sourceNote` records the therapist's own clinical rationale, not a literature citation (unlike the shelved parent-facing concept, this content's authority comes from the therapist who wrote it, not from WHO/ASHA-style sources). The disclaimer ("reference only, does not replace professional judgment") must stay visible in the UI, not buried in the README.

## Stack specifics

- Angular: standalone components + Signals, no NgModules.
- Styling: Tailwind CSS.
- Storage: a single injectable service wrapping `localStorage`, not scattered direct `localStorage` calls across components.
- Rule evaluation: `json-logic-js` (or `json-logic-engine`) for storing/evaluating rule conditions — framework-agnostic, no UI dependency. The rule-editor UI itself is hand-built (condition rows + AND/OR groups), not a third-party Angular query-builder package — the maintained options were evaluated and found too stale (2+ years) to depend on.
- Testing: Vitest.

## Workflow

Follow `openspec/changes/*/tasks.md` in order rather than jumping ahead. Update task checkboxes as work completes.
