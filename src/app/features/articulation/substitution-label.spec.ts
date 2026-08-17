import { describe, expect, it } from 'vitest';

import { ArticulationSubstitution } from '../../models/articulation-record.model';
import { isArticulationError, substitutionLabel } from './substitution-label';

function substitution(overrides: Partial<ArticulationSubstitution> = {}): ArticulationSubstitution {
  return {
    id: 'sub-1',
    caseId: 'case-1',
    targetPhonemeId: 'p',
    processIds: [],
    examples: [],
    updatedOnISODate: '2026-08-17',
    ...overrides,
  };
}

describe('substitutionLabel', () => {
  it('marks a sound with neither an error phoneme nor a diacritic as correct', () => {
    expect(substitutionLabel(substitution())).toBe('ㄆ ✓');
  });

  it('renders a plain substitution', () => {
    expect(substitutionLabel(substitution({ errorPhonemeId: 'b' }))).toBe('ㄆ→ㄅ');
  });

  it('falls back to the target sound when only a diacritic is recorded', () => {
    const label = substitutionLabel(
      substitution({ targetPhonemeId: 'i', errorDiacritic: 'nasalized' }),
    );

    expect(label).toBe('ㄧ→ㄧⁿ');
  });

  it('layers the diacritic on top of a substituted sound', () => {
    const label = substitutionLabel(
      substitution({ targetPhonemeId: 'zh', errorPhonemeId: 'd', errorDiacritic: 'nasalized' }),
    );

    expect(label).toBe('ㄓ→ㄉⁿ');
  });
});

describe('isArticulationError', () => {
  it('does not count a diacritic-only record as a correct production', () => {
    expect(isArticulationError(substitution({ errorDiacritic: 'nasalized' }))).toBe(true);
  });

  it('counts a record with neither field as correct', () => {
    expect(isArticulationError(substitution())).toBe(false);
  });
});
