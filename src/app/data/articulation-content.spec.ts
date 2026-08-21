import { describe, expect, it } from 'vitest';

import { ZhuyinCategory } from '../models/zhuyin.model';
import { STARTER_ARTICULATION_PROCESSES } from './starter-articulation-processes';
import {
  ZHUYIN_CATEGORY_LABELS,
  ZHUYIN_CATEGORY_ORDER,
  ZHUYIN_INVENTORY,
  findZhuyin,
} from './zhuyin-inventory';

function symbolsIn(category: ZhuyinCategory) {
  return ZHUYIN_INVENTORY.filter((symbol) => symbol.category === category);
}

describe('zhuyin inventory', () => {
  it('has unique ids and unique glyphs', () => {
    const ids = ZHUYIN_INVENTORY.map((s) => s.id);
    const glyphs = ZHUYIN_INVENTORY.map((s) => s.symbol);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('covers 21 initials, 3 medials, 15 finals and 5 tones', () => {
    expect(symbolsIn('initial')).toHaveLength(21);
    expect(symbolsIn('medial')).toHaveLength(3);
    expect(symbolsIn('final')).toHaveLength(15);
    expect(symbolsIn('tone')).toHaveLength(5);
    expect(ZHUYIN_INVENTORY).toHaveLength(44);
  });

  it('splits the empty rime into its two apical vowels', () => {
    // ㄭ is one symbol in the 1932 chart but two sounds, depending on the initial before it.
    expect(findZhuyin('ihFront')?.symbol).toBe('ɿ');
    expect(findZhuyin('ihBack')?.symbol).toBe('ʅ');
    for (const id of ['ihFront', 'ihBack']) {
      expect(findZhuyin(id)?.vowel?.apical).toBe(true);
      expect(findZhuyin(id)?.vowel?.height).toBeUndefined();
      expect(findZhuyin(id)?.vowel?.backness).toBeUndefined();
    }
  });

  it('gives ㄦ the same tongue position as ㄜ, differing only in rhoticity', () => {
    const e = findZhuyin('e')?.vowel;
    const er = findZhuyin('er')?.vowel;

    expect(er?.height).toBe(e?.height);
    expect(er?.backness).toBe(e?.backness);
    expect(er?.rounding).toBe(e?.rounding);
    expect(er?.rhotic).toBe(true);
    expect(e?.rhotic).toBeUndefined();
  });

  it('decomposes every compound rime into a nucleus that exists, plus a coda', () => {
    const compounds = ZHUYIN_INVENTORY.filter((s) => s.rime);
    expect(compounds.map((s) => s.id)).toEqual(['ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng']);

    for (const symbol of compounds) {
      expect(findZhuyin(symbol.rime!.nucleusId)?.vowel, symbol.id).toBeDefined();
      expect(symbol.rime!.coda, symbol.id).toBeTruthy();
      // Their features come from the nucleus, so they carry none themselves.
      expect(symbol.vowel, symbol.id).toBeUndefined();
    }
  });

  it('numbers rows consecutively from 1 in the standard sequence', () => {
    expect(ZHUYIN_INVENTORY.map((s) => s.order)).toEqual(
      ZHUYIN_INVENTORY.map((_, index) => index + 1),
    );
    expect(ZHUYIN_INVENTORY[0].symbol).toBe('ㄅ');
    expect(symbolsIn('initial').at(-1)?.symbol).toBe('ㄙ');
    expect(symbolsIn('final')[0].symbol).toBe('ㄚ');
  });

  it('groups the categories in display order without interleaving', () => {
    const categorySequence = ZHUYIN_INVENTORY.map((s) => s.category).filter(
      (category, index, all) => category !== all[index - 1],
    );
    expect(categorySequence).toEqual(ZHUYIN_CATEGORY_ORDER);
  });

  it('attaches articulation features to initials only', () => {
    for (const symbol of ZHUYIN_INVENTORY) {
      if (symbol.category === 'initial') {
        expect(symbol.features).toBeDefined();
        expect(symbol.features?.place).toBeTruthy();
        expect(symbol.features?.manner).toBeTruthy();
      } else {
        expect(symbol.features).toBeUndefined();
      }
    }
  });

  it('marks aspiration contrasts on the stop and affricate pairs', () => {
    expect(findZhuyin('b')?.features?.aspiration).toBe('unaspirated');
    expect(findZhuyin('p')?.features?.aspiration).toBe('aspirated');
    expect(findZhuyin('m')?.features?.aspiration).toBe('notApplicable');
  });

  it('names every tone, since the glyph alone is unclear', () => {
    for (const tone of symbolsIn('tone')) {
      expect(tone.label).toBeTruthy();
    }
  });

  it('has a label for every category', () => {
    for (const category of ZHUYIN_CATEGORY_ORDER) {
      expect(ZHUYIN_CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it('looks symbols up by id', () => {
    expect(findZhuyin('zh')?.symbol).toBe('ㄓ');
    expect(findZhuyin('nope')).toBeUndefined();
  });
});

describe('starter articulation processes', () => {
  it('has unique ids and unique names', () => {
    const ids = STARTER_ARTICULATION_PROCESSES.map((p) => p.id);
    const names = STARTER_ARTICULATION_PROCESSES.map((p) => p.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('covers the processes the diacritic support was added for', () => {
    const ids = STARTER_ARTICULATION_PROCESSES.map((p) => p.id);
    expect(ids).toContain('vowelNasalization');
    expect(ids).toContain('diphthongReduction');
  });

  it('ships every entry as a builtin with a description', () => {
    for (const process of STARTER_ARTICULATION_PROCESSES) {
      expect(process.builtin).toBe(true);
      expect(process.description).toBeTruthy();
    }
  });
});
