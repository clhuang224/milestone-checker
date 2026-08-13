/** 聲母 / 介音 / 韻母 / 聲調 */
export type ZhuyinCategory = 'initial' | 'medial' | 'final' | 'tone';

export type Aspiration = '送氣' | '不送氣' | '不適用';

/** Reference-only articulation features, shown to help the therapist tag processes by hand. */
export interface ArticulationFeatures {
  /** 部位, e.g. 雙唇 / 舌尖 / 舌根. */
  place: string;
  /** 方式, e.g. 塞音 / 鼻音 / 擦音. */
  manner: string;
  aspiration: Aspiration;
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
  features?: ArticulationFeatures;
}
