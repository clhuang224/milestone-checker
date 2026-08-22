import { PLACE_ORDER, ZHUYIN_INVENTORY, findZhuyin } from '../../data/zhuyin-inventory';
import { Manner, ZhuyinSymbol } from '../../models/zhuyin.model';
import { HeardSound } from './parse-heard';

/**
 * Which distinctive-feature change counts as which phonological process.
 *
 * The judgements come from `references/phonological-processes.md`; the place ordering they lean
 * on is `PLACE_ORDER`. Both are the user's, not inferred here.
 *
 * A single error can satisfy several of these at once — ㄙ→ㄉ moves the place backwards *and*
 * changes the manner, so it is both 後置化 and 塞音化. Nothing picks a winner.
 */
type Rule = (target: ZhuyinSymbol, error: ZhuyinSymbol, heard: HeardSound) => boolean;

function placeIndex(symbol: ZhuyinSymbol): number {
  return symbol.features ? PLACE_ORDER.indexOf(symbol.features.place) : -1;
}

function mannerIs(symbol: ZhuyinSymbol, ...manners: Manner[]): boolean {
  return symbol.features !== undefined && manners.includes(symbol.features.manner);
}

/** True when the target rime ends in one of these codas and the error carries no coda at all. */
function codaDropped(target: ZhuyinSymbol, error: ZhuyinSymbol, codas: string[]): boolean {
  const coda = target.rime?.coda;
  return coda !== undefined && codas.includes(coda) && error.rime?.coda === undefined;
}

const RULES: Record<string, Rule> = {
  deaspiration: (target, error) =>
    target.features?.aspiration === 'aspirated' && error.features?.aspiration === 'unaspirated',

  fronting: (target, error) => {
    const [from, to] = [placeIndex(target), placeIndex(error)];
    return from !== -1 && to !== -1 && to < from;
  },

  backing: (target, error) => {
    const [from, to] = [placeIndex(target), placeIndex(error)];
    return from !== -1 && to !== -1 && to > from;
  },

  stopping: (target, error) =>
    mannerIs(target, 'fricative', 'affricate') && mannerIs(error, 'stop'),

  affrication: (target, error) => mannerIs(target, 'fricative') && mannerIs(error, 'affricate'),

  fricativization: (target, error) =>
    mannerIs(target, 'stop', 'affricate') && mannerIs(error, 'fricative'),

  nasalFinalReduction: (target, error) => codaDropped(target, error, ['n', 'ng']),

  diphthongReduction: (target, error) => codaDropped(target, error, ['i', 'u']),

  vowelNasalization: (_target, _error, heard) => heard.diacritic === 'nasalized',
};

/**
 * The processes a recorded error demonstrates.
 *
 * 介音省略 is deliberately absent: it is a syllable-level event (ㄧㄠ→ㄠ) and a record pairs one
 * symbol with one symbol, so there is nothing here to detect it from. It stays manual.
 */
export function deriveProcessIds(targetPhonemeId: string, heard: HeardSound): string[] {
  const target = findZhuyin(targetPhonemeId);
  if (!target) {
    return [];
  }

  // A diacritic on its own is an error even when the sound itself is unchanged (ㄧ→ㄧⁿ).
  const error = heard.symbolId ? findZhuyin(heard.symbolId) : undefined;
  if (!error && !heard.diacritic) {
    return [];
  }

  const comparedAgainst = error ?? target;
  if (comparedAgainst.id === target.id && !heard.diacritic) {
    return [];
  }

  return Object.entries(RULES)
    .filter(([, matches]) => matches(target, comparedAgainst, heard))
    .map(([processId]) => processId);
}

/**
 * The processes that could ever apply to a target sound.
 *
 * Derived by pairing the target with every symbol in the inventory rather than kept as a second
 * table — one source of truth, so 「ㄅ 不該出現塞音化」 falls out of the same rules that do the
 * deriving instead of being maintained alongside them.
 */
export function applicableProcessIds(targetPhonemeId: string): string[] {
  const found = new Set<string>();

  for (const candidate of ZHUYIN_INVENTORY) {
    for (const processId of deriveProcessIds(targetPhonemeId, { symbolId: candidate.id })) {
      found.add(processId);
    }
  }
  for (const processId of deriveProcessIds(targetPhonemeId, { diacritic: 'nasalized' })) {
    found.add(processId);
  }

  return [...found];
}
