import {
  Aspiration,
  Manner,
  Place,
  Voicing,
  ZhuyinCategory,
  ZhuyinSymbol,
} from '../models/zhuyin.model';

/** `order` is assigned from array position, so the source order below is the table order. */
type ZhuyinSeed = Omit<ZhuyinSymbol, 'order'>;

/**
 * Reviewed against `references/zhuyin-initials.md` — edit that file first, then mirror it
 * here; a test asserts the two agree.
 */
const INITIALS: ZhuyinSeed[] = [
  {
    id: 'b',
    symbol: 'ㄅ',
    category: 'initial',
    features: {
      place: 'bilabial',
      manner: 'stop',
      aspiration: 'unaspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 'p',
    symbol: 'ㄆ',
    category: 'initial',
    features: { place: 'bilabial', manner: 'stop', aspiration: 'aspirated', voicing: 'voiceless' },
  },
  {
    id: 'm',
    symbol: 'ㄇ',
    category: 'initial',
    features: {
      place: 'bilabial',
      manner: 'nasal',
      aspiration: 'notApplicable',
      voicing: 'voiced',
    },
  },
  {
    id: 'f',
    symbol: 'ㄈ',
    category: 'initial',
    features: {
      place: 'labiodental',
      manner: 'fricative',
      aspiration: 'notApplicable',
      voicing: 'voiceless',
    },
  },
  {
    id: 'd',
    symbol: 'ㄉ',
    category: 'initial',
    features: {
      place: 'alveolar',
      manner: 'stop',
      aspiration: 'unaspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 't',
    symbol: 'ㄊ',
    category: 'initial',
    features: { place: 'alveolar', manner: 'stop', aspiration: 'aspirated', voicing: 'voiceless' },
  },
  {
    id: 'n',
    symbol: 'ㄋ',
    category: 'initial',
    features: {
      place: 'alveolar',
      manner: 'nasal',
      aspiration: 'notApplicable',
      voicing: 'voiced',
    },
  },
  {
    id: 'l',
    symbol: 'ㄌ',
    category: 'initial',
    features: {
      place: 'alveolar',
      manner: 'lateral',
      aspiration: 'notApplicable',
      voicing: 'voiceless',
    },
  },
  {
    id: 'g',
    symbol: 'ㄍ',
    category: 'initial',
    features: { place: 'velar', manner: 'stop', aspiration: 'unaspirated', voicing: 'voiceless' },
  },
  {
    id: 'k',
    symbol: 'ㄎ',
    category: 'initial',
    features: { place: 'velar', manner: 'stop', aspiration: 'aspirated', voicing: 'voiceless' },
  },
  {
    id: 'h',
    symbol: 'ㄏ',
    category: 'initial',
    features: {
      place: 'velar',
      manner: 'fricative',
      aspiration: 'notApplicable',
      voicing: 'voiceless',
    },
  },
  {
    id: 'j',
    symbol: 'ㄐ',
    category: 'initial',
    features: {
      place: 'alveolopalatal',
      manner: 'affricate',
      aspiration: 'unaspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 'q',
    symbol: 'ㄑ',
    category: 'initial',
    features: {
      place: 'alveolopalatal',
      manner: 'affricate',
      aspiration: 'aspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 'x',
    symbol: 'ㄒ',
    category: 'initial',
    features: {
      place: 'alveolopalatal',
      manner: 'fricative',
      aspiration: 'notApplicable',
      voicing: 'voiceless',
    },
  },
  {
    id: 'zh',
    symbol: 'ㄓ',
    category: 'initial',
    features: {
      place: 'retroflex',
      manner: 'affricate',
      aspiration: 'unaspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 'ch',
    symbol: 'ㄔ',
    category: 'initial',
    features: {
      place: 'retroflex',
      manner: 'affricate',
      aspiration: 'aspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 'sh',
    symbol: 'ㄕ',
    category: 'initial',
    features: {
      place: 'retroflex',
      manner: 'fricative',
      aspiration: 'notApplicable',
      voicing: 'voiceless',
    },
  },
  {
    id: 'r',
    symbol: 'ㄖ',
    category: 'initial',
    features: {
      place: 'retroflex',
      manner: 'fricative',
      aspiration: 'notApplicable',
      voicing: 'voiced',
    },
  },
  {
    id: 'z',
    symbol: 'ㄗ',
    category: 'initial',
    features: {
      place: 'dentalAlveolar',
      manner: 'affricate',
      aspiration: 'unaspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 'c',
    symbol: 'ㄘ',
    category: 'initial',
    features: {
      place: 'dentalAlveolar',
      manner: 'affricate',
      aspiration: 'aspirated',
      voicing: 'voiceless',
    },
  },
  {
    id: 's',
    symbol: 'ㄙ',
    category: 'initial',
    features: {
      place: 'dentalAlveolar',
      manner: 'fricative',
      aspiration: 'notApplicable',
      voicing: 'voiceless',
    },
  },
];

const MEDIALS: ZhuyinSeed[] = [
  { id: 'i', symbol: 'ㄧ', category: 'medial' },
  { id: 'u', symbol: 'ㄨ', category: 'medial' },
  { id: 'yu', symbol: 'ㄩ', category: 'medial' },
];

const FINALS: ZhuyinSeed[] = [
  { id: 'a', symbol: 'ㄚ', category: 'final' },
  { id: 'o', symbol: 'ㄛ', category: 'final' },
  { id: 'e', symbol: 'ㄜ', category: 'final' },
  { id: 'eh', symbol: 'ㄝ', category: 'final' },
  { id: 'ai', symbol: 'ㄞ', category: 'final' },
  { id: 'ei', symbol: 'ㄟ', category: 'final' },
  { id: 'ao', symbol: 'ㄠ', category: 'final' },
  { id: 'ou', symbol: 'ㄡ', category: 'final' },
  { id: 'an', symbol: 'ㄢ', category: 'final' },
  { id: 'en', symbol: 'ㄣ', category: 'final' },
  { id: 'ang', symbol: 'ㄤ', category: 'final' },
  { id: 'eng', symbol: 'ㄥ', category: 'final' },
  { id: 'er', symbol: 'ㄦ', category: 'final' },
  // 空韻 — the rime of ㄓㄔㄕㄖㄗㄘㄙ standing alone. Not one of the standard 37 symbols, but
  // it gets written down when transcribing, so the table needs a row for it.
  { id: 'empty', symbol: 'ㄭ', label: '空韻', category: 'final' },
];

const TONES: ZhuyinSeed[] = [
  { id: 'tone1', symbol: 'ˉ', label: '一聲（陰平，通常不標符號）', category: 'tone' },
  { id: 'tone2', symbol: 'ˊ', label: '二聲', category: 'tone' },
  { id: 'tone3', symbol: 'ˇ', label: '三聲', category: 'tone' },
  { id: 'tone4', symbol: 'ˋ', label: '四聲', category: 'tone' },
  { id: 'tone5', symbol: '˙', label: '輕聲', category: 'tone' },
];

/** 依教育部標準順序排列:聲母 21、介音 3、韻母 13、聲調 5。 */
export const ZHUYIN_INVENTORY: ZhuyinSymbol[] = [...INITIALS, ...MEDIALS, ...FINALS, ...TONES].map(
  (seed, index) => ({ ...seed, order: index + 1 }),
);

export const ZHUYIN_CATEGORY_LABELS: Record<ZhuyinCategory, string> = {
  initial: '聲母',
  medial: '介音',
  final: '韻母',
  tone: '聲調',
};

/** Display order of the category groups, matching ZHUYIN_INVENTORY. */
export const ZHUYIN_CATEGORY_ORDER: ZhuyinCategory[] = ['initial', 'medial', 'final', 'tone'];

export const PLACE_LABELS: Record<Place, string> = {
  bilabial: '雙唇',
  labiodental: '唇齒',
  alveolar: '齒槽',
  velar: '舌根',
  alveolopalatal: '舌面',
  retroflex: '舌尖後',
  dentalAlveolar: '舌尖前',
};

export const MANNER_LABELS: Record<Manner, string> = {
  stop: '塞音',
  affricate: '塞擦音',
  fricative: '擦音',
  nasal: '鼻音',
  lateral: '邊音',
};

export const ASPIRATION_LABELS: Record<Aspiration, string> = {
  aspirated: '送氣',
  unaspirated: '不送氣',
  notApplicable: '不適用',
};

export const VOICING_LABELS: Record<Voicing, string> = {
  voiced: '濁音',
  voiceless: '清音',
};

export function findZhuyin(id: string): ZhuyinSymbol | undefined {
  return ZHUYIN_INVENTORY.find((symbol) => symbol.id === id);
}
