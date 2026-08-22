import { describe, expect, it } from 'vitest';

import { applicableProcessIds, deriveProcessIds } from './derive-processes';
import { parseHeard } from './parse-heard';

/** Derives from what the therapist actually typed, the way the app will. */
function from(targetPhonemeId: string, heardText: string): string[] {
  return deriveProcessIds(targetPhonemeId, parseHeard(heardText)).sort();
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
});

describe('deriveProcessIds', () => {
  it('does not derive a place process from a place change', () => {
    // No source derives 前置化/後置化 from a place ordering — they are enumerated
    // target→error patterns, and the Taiwanese literature warns that widening 前置化 to any
    // forward movement distorts how often it appears. Manual tagging only.
    expect(from('d', 'ㄍㄜ')).toEqual([]);
    expect(from('g', 'ㄉㄜ')).toEqual([]);
    expect(from('zh', 'ㄗ')).toEqual([]);
  });

  it('reads loss of aspiration', () => {
    expect(from('p', 'ㄅㄠ')).toEqual(['deaspiration']);
  });

  it('reads the manner changes', () => {
    expect(from('s', 'ㄉ')).toContain('stopping');
    expect(from('x', 'ㄑ')).toContain('affrication');
    expect(from('j', 'ㄒ')).toContain('fricativization');
  });

  it('reads ㄙ→ㄉ as stopping alone, with no place process attached', () => {
    // The strongest Taiwanese source lists 後置化's error sounds as ㄍㄎㄏㄐㄑㄒ only — ㄉ is not
    // among them — and gives ㄙ→ㄉ as a plain example of 塞音化.
    expect(from('s', 'ㄉ')).toEqual(['stopping']);
  });

  it('reads a nasal coda dropping', () => {
    expect(from('ang', 'ㄚ')).toEqual(['nasalFinalReduction']);
  });

  it('reads a vowel coda dropping', () => {
    expect(from('ai', 'ㄚ')).toEqual(['diphthongReduction']);
  });

  it('reads a nasalized vowel even though the sound itself is unchanged', () => {
    expect(from('i', 'ㄧⁿ')).toEqual(['vowelNasalization']);
  });

  it('derives nothing when the sound was produced correctly', () => {
    expect(from('p', '')).toEqual([]);
    expect(from('p', 'ㄆㄠ')).toEqual([]);
  });

  it('derives nothing from text it cannot parse', () => {
    expect(from('p', '含糊不清')).toEqual([]);
  });

  it('derives nothing for an unknown target', () => {
    expect(from('nope', 'ㄅ')).toEqual([]);
  });

  it('never derives 介音省略, which needs syllable-level data', () => {
    const everything = ['b', 'p', 'd', 'g', 's', 'zh', 'i', 'ai', 'ang'].flatMap((id) =>
      ['ㄅ', 'ㄉ', 'ㄍ', 'ㄒ', 'ㄚ', 'ㄧⁿ'].flatMap((heard) => from(id, heard)),
    );

    expect(everything).not.toContain('medialDeletion');
    expect(everything).not.toContain('fronting');
    expect(everything).not.toContain('backing');
  });
});

describe('applicableProcessIds', () => {
  it('does not offer 塞音化 for a sound that is already a stop', () => {
    expect(applicableProcessIds('b')).not.toContain('stopping');
  });

  it('offers 塞音化 for a fricative', () => {
    expect(applicableProcessIds('s')).toContain('stopping');
  });

  it('does not offer 不送氣化 for a sound with no aspiration contrast', () => {
    expect(applicableProcessIds('m')).not.toContain('deaspiration');
  });

  it('offers 不送氣化 for an aspirated sound', () => {
    expect(applicableProcessIds('p')).toContain('deaspiration');
  });

  it('never offers the place processes, which are not derivable', () => {
    for (const id of ['b', 'g', 's', 'zh']) {
      expect(applicableProcessIds(id), id).not.toContain('fronting');
      expect(applicableProcessIds(id), id).not.toContain('backing');
    }
  });

  it('offers the coda processes only to rimes that have a coda', () => {
    expect(applicableProcessIds('ang')).toContain('nasalFinalReduction');
    expect(applicableProcessIds('ai')).toContain('diphthongReduction');
    expect(applicableProcessIds('a')).not.toContain('nasalFinalReduction');
  });

  it('offers 母音鼻音化 to every sound, since the mark is independent of the sound', () => {
    expect(applicableProcessIds('i')).toContain('vowelNasalization');
    expect(applicableProcessIds('b')).toContain('vowelNasalization');
  });
});
