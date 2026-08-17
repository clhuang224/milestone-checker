import { findZhuyin } from '../../data/zhuyin-inventory';
import {
  ArticulationDiacritic,
  ArticulationSubstitution,
} from '../../models/articulation-record.model';

/** Superscript marks (U+207F etc.) rather than <sup>, so labels stay copy-pasteable plain text. */
const DIACRITIC_MARKS: Record<ArticulationDiacritic, string> = {
  nasalized: 'ⁿ',
};

function glyph(phonemeId: string | undefined): string {
  if (!phonemeId) {
    return '';
  }
  return findZhuyin(phonemeId)?.symbol ?? phonemeId;
}

/**
 * True unless the sound is produced correctly. A diacritic on its own still counts as an
 * error — 'ㄧ→ㄧⁿ' has no substituted phoneme but is not a correct production.
 */
export function isArticulationError(substitution: ArticulationSubstitution): boolean {
  return Boolean(substitution.errorPhonemeId || substitution.errorDiacritic);
}

/** 'ㄆ→ㄅ', 'ㄧ→ㄧⁿ', 'ㄓ→ㄉⁿ', or 'ㄆ ✓' when the target sound is produced correctly. */
export function substitutionLabel(substitution: ArticulationSubstitution): string {
  const target = glyph(substitution.targetPhonemeId);
  if (!isArticulationError(substitution)) {
    return `${target} ✓`;
  }

  // Falls back to the target sound so a diacritic-only record reads 'ㄧ→ㄧⁿ', not '→ⁿ'.
  const base = glyph(substitution.errorPhonemeId) || target;
  const mark = substitution.errorDiacritic ? DIACRITIC_MARKS[substitution.errorDiacritic] : '';
  return `${target}→${base}${mark}`;
}
