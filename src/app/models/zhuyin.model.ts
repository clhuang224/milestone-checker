/** 聲母 / 介音 / 韻母 / 聲調 */
export type ZhuyinCategory = 'initial' | 'medial' | 'final' | 'tone';

/** 部位 — display labels live in PLACE_LABELS. */
export type Place =
  | 'bilabial'
  | 'labiodental'
  | 'alveolar'
  | 'velar'
  | 'alveolopalatal'
  | 'retroflex'
  | 'dentalAlveolar';

/** 方式 */
export type Manner = 'stop' | 'affricate' | 'fricative' | 'nasal' | 'lateral';

/** 送氣 */
export type Aspiration = 'aspirated' | 'unaspirated' | 'notApplicable';

/** 清濁 */
export type Voicing = 'voiced' | 'voiceless';

/**
 * 辨異徵性 — the distinctive features separating one sound from another.
 *
 * Values are English ids; see `references/zhuyin-initials.md` for the reviewed source table.
 */
export interface DistinctiveFeatures {
  place: Place;
  manner: Manner;
  aspiration: Aspiration;
  voicing: Voicing;
}

export interface ZhuyinSymbol {
  id: string;
  /** Display glyph, e.g. 'ㄅ', 'ㄚ', 'ˊ'. */
  symbol: string;
  /** Spelled-out name, for rows where the glyph alone is unclear (tones). */
  label?: string;
  category: ZhuyinCategory;
  /** Table sort order, following the Ministry of Education's standard sequence. */
  order: number;
  /** Only populated for category === 'initial' in this change. */
  features?: DistinctiveFeatures;
}
