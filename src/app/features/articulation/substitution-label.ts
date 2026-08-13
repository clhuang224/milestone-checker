import { findZhuyin } from '../../data/zhuyin-inventory';
import { ArticulationSubstitution } from '../../models/articulation-record.model';

function glyph(phonemeId: string | undefined): string {
  if (!phonemeId) {
    return '';
  }
  return findZhuyin(phonemeId)?.symbol ?? phonemeId;
}

/** 'ㄆ→ㄅ' for a substitution, 'ㄆ ✓' when the target sound is produced correctly. */
export function substitutionLabel(substitution: ArticulationSubstitution): string {
  const target = glyph(substitution.targetPhonemeId);
  return substitution.errorPhonemeId
    ? `${target}→${glyph(substitution.errorPhonemeId)}`
    : `${target} ✓`;
}
