# milestone-checker — project rules

General habits (commit language, Conventional Commits, strict TypeScript, Vitest, Angular standalone+Signals, small atomic commits) live in the global `dotfiles/claude/CLAUDE.md` — this file only adds project-specific rules on top. If something isn't covered here, check that file rather than guessing.

## Experimentation philosophy & review posture

This repo exists to experiment with **Claude Code** (subagents, OpenSpec-driven workflow, etc.) and with **Angular** (standalone + Signals, zoneless) — not to ship a polished product. The user is intentionally **not doing line-by-line code review** ("vibe coding"); Claude Code is trusted to drive development and self-verify.

Because there's no human review gate, compensate by:

- Keeping commits **small and atomic** (already a global rule, but doubly important here) — one task/subtask from `tasks.md` per commit where practical, so a regression is easy to bisect back to a single small change.
- Treating `ng build` / `ng test` passing as the actual quality gate before considering a task done, not a nice-to-have.
- Using subagents freely where they fit the task — that's part of what this project is for.

## Product direction

As of the `add-therapist-rule-engine` change， this app's target audience is **speech-language therapists （語言治療師）**， not parents/caregivers. The earlier parent-facing milestone-checklist concept (`add-lang-speech-swallowing-checklist`) is shelved — don't resurrect its data model (`Milestone`/`AchievementRecord`/`ObservationEntry`) without an explicit new OpenSpec change. The core mechanic is now: therapists author condition→action rules (stored as JsonLogic JSON) that fire warnings/summaries against a case's recorded findings， and help draft report text.

## Working as a team

The user's role is the developer and the clinical authority. Claude Code's role is their
assistant and the one who talks to them — everything below reports through Claude Code, not
directly to the user.

Use subagents for the work they fit, rather than doing everything inline:

| 角色       | 何時派                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文獻查證   | Any clinical claim that needs grounding. Reports what sources say **and what they leave unsettled** — "the literature does not settle this" is a real answer, and a more useful one than a guess. |
| 質疑／辯論 | Before committing to a design with a hard-to-reverse consequence. Its job is to argue the other side, not to agree.                                                                               |
| UI/UX      | Screen layout and interaction, especially where the arrangement carries clinical meaning (the articulation grid's columns are a place ordering, not decoration).                                  |
| Angular/TS | Data-model and architecture decisions, signals, strict-mode types.                                                                                                                                |

The point is a team that covers 需求 → 設計 → 架構. Claude Code coordinates, resolves conflicts
between them, and reports back in one voice.

Subagents run on **Opus 5 at most** — pass `model: "opus"`, never a larger tier.

Do not let a subagent invent clinical content either — the rule below binds them too.

## Scope discipline

This is an experiment project for trying Claude Code + Angular. The first OpenSpec change is scoped to **language / speech / swallowing** domains only. Don't silently expand scope to other clinical domains (motor, cognition, etc.) — that belongs in a later OpenSpec change.

## Content vs. code language

- Code, comments, commit messages: **English** (per global `CLAUDE.md`).
- User-facing app content (labels, finding/rule descriptions, warning and report text): **Traditional Chinese (Taiwan usage)** — this app's audience is Chinese-speaking speech-language therapists.
- OpenSpec docs (`proposal.md`, `design.md`, `tasks.md`, `specs/**/spec.md`): **Traditional Chinese**, prose only — keep OpenSpec's structural keywords (`ADDED Requirements`, `Requirement:`, `Scenario:`, `WHEN`/`THEN`/`AND`, `SHALL`/`SHALL NOT`) in English since the tooling parses on them.
- **Identifiers and union-type members are English, including domain vocabulary.** Don't make
  Chinese strings the type — `Voicing = 'voiced' | 'voiceless'`, not `'濁音' | '清音'`. Map the id
  to its Chinese label at the display layer (see `PLACE_LABELS` beside `ZHUYIN_CATEGORY_LABELS`).

### Fixed terminology

Some domain terms have a settled translation in this project. Use it and no other:

| English             | 用這個   | 不要用                   |
| ------------------- | -------- | ------------------------ |
| distinctive feature | 辨異徵性 | 特徵、構音特徵、區別特徵 |

### Punctuation in Chinese text

Chinese prose uses **fullwidth punctuation** — `，` not `,`, `（）` not `()`. This applies to UI
strings, Chinese code comments, and the Chinese docs above. Exceptions:

- Code is code: `,` and `()` inside identifiers, JSON, and code samples in fenced blocks stay ASCII.
- A comment written as English that merely names a Chinese term keeps English punctuation
  (`/** 測試字詞, e.g. 「包」 */`).

## Clinical content: never invent it

Speech-language pathology content — phonetic features, phonological processes, swallowing
criteria, age thresholds, severity scales — **must come from the user, not from you**. Don't
generate a plausible-looking table and ship it. If you don't know, split the gap into small
concrete questions and ask them one at a time.

This rule exists because it already went wrong: the initial consonant feature table, the
phonological process list, the "over four with errors beyond ㄓㄔㄕㄖ" thresholds and the
corrected-age constants were all model-generated. Marking such content as "placeholder pending
therapist review" used to be the mitigation — **that convention is retired**. The user is the
reviewer, so a placeholder marker just adds noise while leaving invented content in place.

- Clinical reference data lives in `references/` as markdown tables, so it can be read, queried,
  and handed to another therapist to check. Code reads the same values; a test keeps the two in
  step.
- The UI disclaimer ("reference only, does not replace professional judgment") must stay visible,
  not buried in the README.

## Stack specifics

- Angular: standalone components + Signals, no NgModules.
- Styling: Tailwind CSS.
- Storage: a single injectable service wrapping `localStorage`, not scattered direct `localStorage` calls across components.
- Rule evaluation: `json-logic-js` (or `json-logic-engine`) for storing/evaluating rule conditions — framework-agnostic, no UI dependency. The rule-editor UI itself is hand-built (condition rows + AND/OR groups), not a third-party Angular query-builder package — the maintained options were evaluated and found too stale (2+ years) to depend on.
- Testing: Vitest.

## Workflow

Follow `openspec/changes/*/tasks.md` in order rather than jumping ahead. Update task checkboxes as work completes.
