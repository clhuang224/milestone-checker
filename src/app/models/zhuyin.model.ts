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

/** 舌位高低 — four levels, so there is no "mid"; see references/zhuyin-finals.md. */
export type VowelHeight = 'close' | 'closeMid' | 'openMid' | 'open';

/** 舌位前後 */
export type VowelBackness = 'front' | 'central' | 'back';

/** 唇形 */
export type Rounding = 'rounded' | 'unrounded';

/** 韻尾 — the only four codas Mandarin rimes take. */
export type Coda = 'i' | 'u' | 'n' | 'ng';

/** 辨異徵性 of a single vowel. */
export interface VowelFeatures {
  /** Left unset for apical vowels, which the literature does not place on this scale. */
  height?: VowelHeight;
  /** Left unset for apical vowels. */
  backness?: VowelBackness;
  rounding: Rounding;
  /** 捲舌 — orthogonal to tongue position, hence its own flag rather than a backness value. */
  rhotic?: boolean;
  /** 舌尖元音 — ɿ and ʅ, defined by tongue posture rather than height/backness. */
  apical?: boolean;
}

/**
 * 韻頭＋韻腹＋韻尾. Compound rimes carry no vowel features of their own — theirs come from the
 * nucleus. Splitting them this way makes 複韻母簡化 and 聲隨韻母簡化 the same event: coda loss.
 *
 * A modelling convenience, not a phonetic claim: ㄞ is not acoustically ㄚ followed by ㄧ.
 */
export interface RimeStructure {
  /** 韻頭 — a medial's ZhuyinSymbol id, when the rime has one. */
  medialId?: string;
  /** 韻腹 — the ZhuyinSymbol id of the main vowel. */
  nucleusId: string;
  /** 韻尾 */
  coda?: Coda;
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
  /** Consonant 辨異徵性 — initials only. */
  features?: DistinctiveFeatures;
  /** Vowel 辨異徵性 — medials and simple finals; absent on compound rimes and tones. */
  vowel?: VowelFeatures;
  /** Present on compound rimes (ㄞㄟㄠㄡㄢㄣㄤㄥ), which decompose into nucleus + coda. */
  rime?: RimeStructure;
}
