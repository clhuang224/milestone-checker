# Proposal: add-lang-speech-swallowing-checklist

## Why

This is an experiment project for trying out Claude Code + Angular together, built around a real (if small) use case: a bright, easy-to-use checklist that lets a parent/caregiver track a child's developmental milestones and jot down when each one happened.

Rather than boiling the ocean on "all of child development" in one pass, the first slice covers three related domains that are commonly grouped together in speech-language pathology: **語言 (language), 言語 (speech/articulation), 吞嚥 (swallowing/feeding)**. Later changes can add more domains (motor, cognition, social-emotional, ...) following the same pattern.

## What

- A hierarchical checklist: **major category → sub-items**, where each sub-item can be marked achieved with a date.
- Each sub-item can optionally show **suggested activities** (things a parent can try at home).
- A free-text **observation log** per child, so parents can jot down notes beyond just checking boxes.
- A visible, permanent **"reference only, not a diagnostic tool" disclaimer**.
- Bright, cheerful visual style.
- No backend, no accounts — everything lives in the browser's `localStorage`.

## Out of scope (for this change)

- Domains other than language/speech/swallowing.
- Cross-device sync (the reference project used a URL-hash sharing trick for this; worth considering later, not now).
- Any server, database, or authentication.
- Finalized clinical milestone content — the actual ages/descriptions need a credible source and review; this change only builds the structure with placeholder example data.

## Reference

Conceptually inspired by (not copied from) [AgendaLu/piaget-based-child-checklist](https://github.com/AgendaLu/piaget-based-child-checklist), which covers 0–24mo across 5 domains using Piaget theory + WHO/Denver II percentiles, vanilla JS + Tailwind + D3, localStorage-only with URL-hash cross-device sync. This project reimplements the idea with Angular and its own scope/style, not a port.
