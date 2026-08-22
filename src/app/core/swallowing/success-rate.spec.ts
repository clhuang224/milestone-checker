import { describe, expect, it } from 'vitest';

import { SwallowUnitDefinition } from '../../models/swallow-catalogue.model';
import { outcomeLabel, successPercent } from './success-rate';

const units: SwallowUnitDefinition[] = [{ id: 'mouthful', name: '口', builtin: true }];

describe('successPercent', () => {
  it('takes an estimate as given', () => {
    expect(successPercent({ kind: 'estimated', successPercent: 90 })).toBe(90);
  });

  it('derives a rate from counts', () => {
    expect(
      successPercent({
        kind: 'counted',
        unitId: 'mouthful',
        attempts: 10,
        chokes: 1,
        comparison: 'eq',
      }),
    ).toBe(90);
  });

  it('reads 「一次以下」 as exactly one, the conservative direction', () => {
    // Assuming fewer would claim a success the therapist did not record.
    expect(
      successPercent({
        kind: 'counted',
        unitId: 'mouthful',
        attempts: 3,
        chokes: 1,
        comparison: 'lte',
      }),
    ).toBe(67);
  });

  it('reports 100% when nothing was choked', () => {
    expect(
      successPercent({
        kind: 'counted',
        unitId: 'mouthful',
        attempts: 5,
        chokes: 0,
        comparison: 'eq',
      }),
    ).toBe(100);
  });

  it('does not divide by zero attempts', () => {
    expect(
      successPercent({
        kind: 'counted',
        unitId: 'mouthful',
        attempts: 0,
        chokes: 0,
        comparison: 'eq',
      }),
    ).toBe(0);
  });

  it('clamps a nonsensical estimate into range', () => {
    expect(successPercent({ kind: 'estimated', successPercent: 140 })).toBe(100);
    expect(successPercent({ kind: 'estimated', successPercent: -5 })).toBe(0);
  });
});

describe('outcomeLabel', () => {
  it('shows an estimate as an estimate, not as a count', () => {
    expect(outcomeLabel({ kind: 'estimated', successPercent: 90 })).toBe('約 90%');
  });

  it('keeps the unit the therapist chose', () => {
    const label = outcomeLabel(
      { kind: 'counted', unitId: 'mouthful', attempts: 10, chokes: 1, comparison: 'eq' },
      units,
    );

    expect(label).toBe('10 口中嗆咳 1 口（90%）');
  });

  it('preserves 「以下」 rather than flattening it to the derived number', () => {
    const label = outcomeLabel(
      { kind: 'counted', unitId: 'mouthful', attempts: 3, chokes: 1, comparison: 'lte' },
      units,
    );

    expect(label).toContain('以下');
    expect(label).toContain('67%');
  });

  it('falls back to the raw unit id rather than dropping it', () => {
    const label = outcomeLabel({
      kind: 'counted',
      unitId: 'gone',
      attempts: 2,
      chokes: 0,
      comparison: 'eq',
    });

    expect(label).toContain('gone');
  });
});
