import { ZHUYIN_INVENTORY } from '../../data/zhuyin-inventory';
import { ArticulationDiacritic } from '../../models/articulation-record.model';
import { ZhuyinCategory } from '../../models/zhuyin.model';

/** What the therapist typed, resolved into something comparable against the target sound. */
export interface HeardSound {
  /** ZhuyinSymbol id of the first matching symbol found, if there was one. */
  symbolId?: string;
  diacritic?: ArticulationDiacritic;
}

/**
 * U+207F, the notation this parser accepts for nasalization. Exported so the grid's insert button
 * and the labels write the very same character the parser reads back.
 */
export const NASALIZED_MARK = 'ⁿ';

const SYMBOL_BY_GLYPH = new Map(ZHUYIN_INVENTORY.map((symbol) => [symbol.symbol, symbol]));

/**
 * Reads the sound actually heard out of free text like 「ㄆㄠ」.
 *
 * Only the *first* matching zhuyin symbol matters: the table records one target sound per row, so
 * that is what the rest of the syllable is being compared against.
 *
 * `category` narrows what counts as a match, and exists because the rows differ in where their
 * sound sits in the syllable. A tone row is written as a whole syllable (「ㄆㄠˊ」), so taking the
 * first symbol of any category would record its initial as the sound heard — an error the
 * therapist never wrote down. Nothing guards against that afterwards: the app deliberately derives
 * no phonological process from a tone target, so no rule ever reads the value and no rule ever
 * contradicts it. A wrong value here would sit in the record unchallenged, which is why this
 * prefers recording nothing over recording a symbol picked up by accident.
 *
 * The nasalization mark counts only when it directly follows that symbol — in 「ㄉㄭⁿ」 the mark
 * belongs to ㄭ, not to ㄉ, and treating it as ㄉ's would invent an error too.
 *
 * Text with no matching zhuyin in it is not an error. The therapist's note is kept as written; it
 * simply yields nothing to derive from.
 */
export function parseHeard(text: string, category?: ZhuyinCategory): HeardSound {
  const characters = [...text.trim()];
  const index = characters.findIndex((character) => {
    const symbol = SYMBOL_BY_GLYPH.get(character);
    return symbol !== undefined && (category === undefined || symbol.category === category);
  });
  if (index === -1) {
    return {};
  }

  return {
    symbolId: SYMBOL_BY_GLYPH.get(characters[index])?.id,
    diacritic: characters[index + 1] === NASALIZED_MARK ? 'nasalized' : undefined,
  };
}
