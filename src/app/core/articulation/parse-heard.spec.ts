import { describe, expect, it } from 'vitest';

import { ArticulationProbe } from '../../models/articulation-record.model';
import { parseHeard } from './parse-heard';
import { errorLabel, isErrorItem, probeErrors } from './probe-errors';

function probe(targetPhonemeId: string, ...heard: string[]): ArticulationProbe {
  return {
    id: `probe-${targetPhonemeId}`,
    caseId: 'case-1',
    recordId: 'assessment-1',
    targetPhonemeId,
    items: heard.map((h) => ({ word: '詞', heard: h })),
    updatedOnISODate: '2026-09-20',
  };
}

describe('parseHeard', () => {
  it('takes the first zhuyin symbol out of a whole syllable', () => {
    expect(parseHeard('ㄆㄠ')).toEqual({ symbolId: 'p', diacritic: undefined });
  });

  it('reads a nasalization mark that follows the first symbol', () => {
    expect(parseHeard('ㄧⁿ')).toEqual({ symbolId: 'i', diacritic: 'nasalized' });
  });

  it('does not claim a nasalization mark that belongs to a later symbol', () => {
    // The ⁿ in 「ㄉㄭⁿ」 marks ㄭ, not ㄉ.
    expect(parseHeard('ㄉㄭⁿ')).toEqual({ symbolId: 'd', diacritic: undefined });
  });

  it('skips non-zhuyin text before the sound', () => {
    expect(parseHeard('聽起來像 ㄍㄜ')).toMatchObject({ symbolId: 'g' });
  });

  it('returns nothing derivable when there is no zhuyin at all', () => {
    expect(parseHeard('說不清楚')).toEqual({});
    expect(parseHeard('')).toEqual({});
  });

  it('reads the tone mark rather than the initial when asked for a tone', () => {
    expect(parseHeard('ㄆㄠˊ', 'tone')).toEqual({ symbolId: 'tone2', diacritic: undefined });
  });

  it('still reads the initial of that same syllable when no category is asked for', () => {
    expect(parseHeard('ㄆㄠˊ')).toEqual({ symbolId: 'p', diacritic: undefined });
  });

  it('reads nothing from a syllable carrying no tone mark', () => {
    expect(parseHeard('ㄆㄠ', 'tone')).toEqual({});
  });
});

describe('tone rows through probeErrors', () => {
  it('records the tone that was heard, not the syllable it was written in', () => {
    const [error] = probeErrors([probe('tone4', 'ㄆㄠˊ')]);

    expect(error.sound.symbolId).toBe('tone2');
    expect(errorLabel(error)).toBe('ˋ→ˊ');
  });

  it('keeps an unmarked first tone as an error while deriving nothing from it', () => {
    // 一聲 is normally left unmarked, so there is no symbol to read — but the therapist did write
    // in the 錯音 box, so the item still counts and the label falls back to their own text.
    expect(isErrorItem({ word: '詞', heard: 'ㄆㄠ' })).toBe(true);

    const [error] = probeErrors([probe('tone4', 'ㄆㄠ')]);

    expect(error.sound.symbolId).toBeUndefined();
    expect(error.sound.diacritic).toBeUndefined();
    expect(error.processIds).toEqual([]);
    expect(errorLabel(error)).toBe('ˋ→ㄆㄠ');
  });
});
