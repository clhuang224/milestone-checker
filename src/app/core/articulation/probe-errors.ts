import { findZhuyin } from '../../data/zhuyin-inventory';
import {
  ArticulationDiacritic,
  ArticulationProbe,
  ProbeItem,
} from '../../models/articulation-record.model';
import { deriveProcessIds } from './derive-processes';
import { HeardSound, NASALIZED_MARK, parseHeard } from './parse-heard';

/** Superscript marks rather than <sup>, so labels stay copy-pasteable plain text. */
const DIACRITIC_MARKS: Record<ArticulationDiacritic, string> = {
  nasalized: NASALIZED_MARK,
};

/** One recorded item that came out wrong, with what it demonstrates. */
export interface ProbeError {
  targetPhonemeId: string;
  word: string;
  /** As the therapist typed it. */
  heard: string;
  sound: HeardSound;
  processIds: string[];
}

function glyph(symbolId: string | undefined): string {
  return symbolId ? (findZhuyin(symbolId)?.symbol ?? symbolId) : '';
}

/** An item counts as an error whenever anything was written in the 錯音 box. */
export function isErrorItem(item: ProbeItem): boolean {
  return item.heard.trim() !== '';
}

/** 'ㄆ→ㄅ', or 'ㄧ→ㄧⁿ' when only a diacritic separates the two. */
export function errorLabel(error: ProbeError): string {
  const target = glyph(error.targetPhonemeId);
  const base = glyph(error.sound.symbolId) || target;
  const mark = error.sound.diacritic ? DIACRITIC_MARKS[error.sound.diacritic] : '';

  // Nothing parseable — show what was written rather than pretending to have understood it.
  if (!error.sound.symbolId && !error.sound.diacritic) {
    return `${target}→${error.heard.trim()}`;
  }
  return `${target}→${base}${mark}`;
}

/** Flattens the grid into the errors it holds, each already carrying its derived processes. */
export function probeErrors(probes: ArticulationProbe[]): ProbeError[] {
  return probes.flatMap((probe) =>
    probe.items.filter(isErrorItem).map((item) => {
      const sound = parseHeard(item.heard);
      return {
        targetPhonemeId: probe.targetPhonemeId,
        word: item.word,
        heard: item.heard,
        sound,
        processIds: deriveProcessIds(probe.targetPhonemeId, sound),
      };
    }),
  );
}
