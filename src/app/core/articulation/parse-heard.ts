import { ZHUYIN_INVENTORY } from '../../data/zhuyin-inventory';
import { ArticulationDiacritic } from '../../models/articulation-record.model';

/** What the therapist typed, resolved into something comparable against the target sound. */
export interface HeardSound {
  /** ZhuyinSymbol id of the first symbol found, if there was one. */
  symbolId?: string;
  diacritic?: ArticulationDiacritic;
}

/**
 * U+207F, the notation this parser accepts for nasalization. Exported so the grid's insert button
 * and the labels write the very same character the parser reads back.
 */
export const NASALIZED_MARK = 'ⁿ';

const SYMBOL_BY_GLYPH = new Map(ZHUYIN_INVENTORY.map((symbol) => [symbol.symbol, symbol.id]));

/**
 * Reads the sound actually heard out of free text like 「ㄆㄠ」.
 *
 * Only the *first* zhuyin symbol matters: the table records one target sound per row, so that
 * is what the rest of the syllable is being compared against.
 *
 * The nasalization mark counts only when it directly follows that first symbol — in 「ㄉㄭⁿ」 the
 * mark belongs to ㄭ, not to ㄉ, and treating it as ㄉ's would invent an error the therapist
 * never recorded.
 *
 * Text with no zhuyin in it is not an error. The therapist's note is kept as written; it simply
 * yields nothing to derive from.
 */
export function parseHeard(text: string): HeardSound {
  const characters = [...text.trim()];
  const index = characters.findIndex((character) => SYMBOL_BY_GLYPH.has(character));
  if (index === -1) {
    return {};
  }

  return {
    symbolId: SYMBOL_BY_GLYPH.get(characters[index]),
    diacritic: characters[index + 1] === NASALIZED_MARK ? 'nasalized' : undefined,
  };
}
