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

  it('covers 21 initials, 3 medials, 13 finals plus the empty rime, and 5 tones', () => {
    expect(symbolsIn('initial')).toHaveLength(21);
    expect(symbolsIn('medial')).toHaveLength(3);
    expect(symbolsIn('final')).toHaveLength(14);
    expect(symbolsIn('tone')).toHaveLength(5);
    expect(ZHUYIN_INVENTORY).toHaveLength(43);
  });

  it('carries the empty rime, which is not one of the standard 37 symbols', () => {
    expect(findZhuyin('empty')?.symbol).toBe('ㄭ');
    expect(findZhuyin('empty')?.category).toBe('final');
    expect(findZhuyin('empty')?.features).toBeUndefined();
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
    expect(findZhuyin('b')?.features?.aspiration).toBe('不送氣');
    expect(findZhuyin('p')?.features?.aspiration).toBe('送氣');
    expect(findZhuyin('m')?.features?.aspiration).toBe('不適用');
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

  it('flags every entry as a builtin placeholder pending therapist review', () => {
    for (const process of STARTER_ARTICULATION_PROCESSES) {
      expect(process.builtin).toBe(true);
      expect(process.sourceNote).toBeTruthy();
      expect(process.description).toBeTruthy();
    }
  });
});
