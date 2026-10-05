/**
 * Biological sex, required. It changes what counts as typical — voice norms differ by sex, and so
 * does child language development — so a case recorded without it cannot be compared against
 * anything. No rule reads it yet; it is collected because the forms that will need it are coming.
 */
export type Sex = 'female' | 'male';

export const SEX_LABELS: Record<Sex, string> = {
  female: '女',
  male: '男',
};

/**
 * A language on the built-in list. Languages the therapist types in themselves live in
 * `Case.otherNativeLanguages`, not in this union.
 *
 * A rule reading this asks whether the norms being applied — the assessment forms are normed on
 * Taiwanese Mandarin — match the case's language background: an error against those norms may be
 * a language difference rather than a disorder. It is not a question of whether a language is
 * tonal.
 */
export type NativeLanguageId =
  | 'mandarin'
  | 'taiwanese'
  | 'hakka'
  | 'indigenous'
  | 'pingpu'
  | 'matsu'
  | 'naturalSignLanguage'
  | 'signedChinese'
  | 'vietnamese'
  | 'indonesian'
  | 'thai'
  | 'burmese'
  | 'khmer'
  | 'filipino'
  | 'malay'
  | 'cantonese';

export const NATIVE_LANGUAGE_LABELS: Record<NativeLanguageId, string> = {
  mandarin: '華語',
  taiwanese: '台灣台語',
  hakka: '台灣客語',
  indigenous: '原住民族語',
  pingpu: '平埔族群語',
  matsu: '馬祖語',
  naturalSignLanguage: '自然手語',
  signedChinese: '文法手語',
  vietnamese: '越南語',
  indonesian: '印尼語',
  thai: '泰語',
  burmese: '緬甸語',
  khmer: '柬埔寨語',
  filipino: '菲律賓語',
  malay: '馬來語',
  cantonese: '粵語',
};

/** Display order for the case form and the condition editor's dropdown. */
export const NATIVE_LANGUAGE_ORDER: NativeLanguageId[] = [
  'mandarin',
  'taiwanese',
  'hakka',
  'indigenous',
  'pingpu',
  'matsu',
  'naturalSignLanguage',
  'signedChinese',
  'vietnamese',
  'indonesian',
  'thai',
  'burmese',
  'khmer',
  'filipino',
  'malay',
  'cantonese',
];

/**
 * Hearing status of one ear. There is deliberately no 'unknown' member: an ear nobody has
 * assessed is an absent field, not a value.
 *
 * 'aided' covers both a hearing aid and a cochlear implant: nothing tells the two apart today,
 * and splitting them would raise a clinical question nobody needs answered yet.
 *
 * The projection to facts is lossy: each ear becomes a boolean "normal" (`leftNormal`,
 * `rightNormal`) and a better-ear value (`betterEarNormal`) is synthesised from both. Whoever adds
 * a member here must decide what it counts as in all three of those places, not just one.
 */
export type HearingStatus = 'normal' | 'abnormal' | 'aided';

export const HEARING_STATUS_LABELS: Record<HearingStatus, string> = {
  normal: '正常',
  abnormal: '異常',
  aided: '配戴助聽器／人工電子耳',
};

/** Display order for the case form and the condition editor's dropdown. */
export const HEARING_STATUS_ORDER: HearingStatus[] = ['normal', 'abnormal', 'aided'];

/**
 * Left and right ears are recorded separately. An ear left blank is `undefined`, and rules that
 * read that ear do not evaluate.
 */
export interface CaseHearing {
  left?: HearingStatus;
  right?: HearingStatus;
}

export interface Case {
  id: string;
  label: string;
  createdOnISODate: string;
  sex: Sex;
  /**
   * YYYY-MM-DD. Stores the birth date rather than an age, so the derived age can never go
   * stale — rules like 「四歲以上」 read `case.ageInMonths`, computed at evaluation time.
   */
  birthDateISO?: string;
  /**
   * Gestational age at birth, in weeks. Drives corrected age for preterm cases; leave unset for
   * a term birth, which is treated the same as no correction.
   */
  gestationalWeeks?: number;
  /**
   * Checked languages from the built-in list. Unset is `undefined`, never `[]`: a case nobody has
   * asked about must stay distinguishable from one whose answer is "none of these" — rules skip
   * the first and evaluate the second.
   */
  nativeLanguages?: NativeLanguageId[];
  /**
   * Languages the therapist typed in, kept as typed. Never read by rules; only ids reach the
   * facts. Kept apart from `nativeLanguages` because `(NativeLanguageId | string)[]` collapses to
   * `string[]` and the union would stop checking anything.
   */
  otherNativeLanguages?: string[];
  /**
   * Absent when neither ear has been recorded. Recording only one ear is a legal state — never
   * fill in a default for the other ear.
   */
  hearing?: CaseHearing;
  note?: string;
}

export interface RecordProfile {
  recordId: string;
  /** Key is a FindingDefinition id. */
  values: Record<string, boolean | number>;
  updatedOnISODate: string;
}
