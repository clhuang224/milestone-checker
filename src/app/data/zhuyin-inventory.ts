import { ZhuyinCategory, ZhuyinSymbol } from '../models/zhuyin.model';

/** `order` is assigned from array position, so the source order below is the table order. */
type ZhuyinSeed = Omit<ZhuyinSymbol, 'order'>;

/**
 * 聲母的構音特徵(部位/方式/送氣)是示意用佔位資料——尚未經治療師審核,正式使用前必須由
 * 治療師本人確認或修改(對應 tasks.md 6.1 的審核關卡)。這些特徵只用來顯示參考,系統不會
 * 拿它們自動推論音韻歷程。
 */
const INITIALS: ZhuyinSeed[] = [
  {
    id: 'b',
    symbol: 'ㄅ',
    category: 'initial',
    features: { place: '雙唇', manner: '塞音', aspiration: '不送氣' },
  },
  {
    id: 'p',
    symbol: 'ㄆ',
    category: 'initial',
    features: { place: '雙唇', manner: '塞音', aspiration: '送氣' },
  },
  {
    id: 'm',
    symbol: 'ㄇ',
    category: 'initial',
    features: { place: '雙唇', manner: '鼻音', aspiration: '不適用' },
  },
  {
    id: 'f',
    symbol: 'ㄈ',
    category: 'initial',
    features: { place: '唇齒', manner: '擦音', aspiration: '不適用' },
  },
  {
    id: 'd',
    symbol: 'ㄉ',
    category: 'initial',
    features: { place: '舌尖', manner: '塞音', aspiration: '不送氣' },
  },
  {
    id: 't',
    symbol: 'ㄊ',
    category: 'initial',
    features: { place: '舌尖', manner: '塞音', aspiration: '送氣' },
  },
  {
    id: 'n',
    symbol: 'ㄋ',
    category: 'initial',
    features: { place: '舌尖', manner: '鼻音', aspiration: '不適用' },
  },
  {
    id: 'l',
    symbol: 'ㄌ',
    category: 'initial',
    features: { place: '舌尖', manner: '邊音', aspiration: '不適用' },
  },
  {
    id: 'g',
    symbol: 'ㄍ',
    category: 'initial',
    features: { place: '舌根', manner: '塞音', aspiration: '不送氣' },
  },
  {
    id: 'k',
    symbol: 'ㄎ',
    category: 'initial',
    features: { place: '舌根', manner: '塞音', aspiration: '送氣' },
  },
  {
    id: 'h',
    symbol: 'ㄏ',
    category: 'initial',
    features: { place: '舌根', manner: '擦音', aspiration: '不適用' },
  },
  {
    id: 'j',
    symbol: 'ㄐ',
    category: 'initial',
    features: { place: '舌面', manner: '塞擦音', aspiration: '不送氣' },
  },
  {
    id: 'q',
    symbol: 'ㄑ',
    category: 'initial',
    features: { place: '舌面', manner: '塞擦音', aspiration: '送氣' },
  },
  {
    id: 'x',
    symbol: 'ㄒ',
    category: 'initial',
    features: { place: '舌面', manner: '擦音', aspiration: '不適用' },
  },
  {
    id: 'zh',
    symbol: 'ㄓ',
    category: 'initial',
    features: { place: '舌尖後(捲舌)', manner: '塞擦音', aspiration: '不送氣' },
  },
  {
    id: 'ch',
    symbol: 'ㄔ',
    category: 'initial',
    features: { place: '舌尖後(捲舌)', manner: '塞擦音', aspiration: '送氣' },
  },
  {
    id: 'sh',
    symbol: 'ㄕ',
    category: 'initial',
    features: { place: '舌尖後(捲舌)', manner: '擦音', aspiration: '不適用' },
  },
  {
    id: 'r',
    symbol: 'ㄖ',
    category: 'initial',
    features: { place: '舌尖後(捲舌)', manner: '擦音', aspiration: '不適用' },
  },
  {
    id: 'z',
    symbol: 'ㄗ',
    category: 'initial',
    features: { place: '舌尖前', manner: '塞擦音', aspiration: '不送氣' },
  },
  {
    id: 'c',
    symbol: 'ㄘ',
    category: 'initial',
    features: { place: '舌尖前', manner: '塞擦音', aspiration: '送氣' },
  },
  {
    id: 's',
    symbol: 'ㄙ',
    category: 'initial',
    features: { place: '舌尖前', manner: '擦音', aspiration: '不適用' },
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
];

const TONES: ZhuyinSeed[] = [
  { id: 'tone1', symbol: 'ˉ', label: '一聲(陰平,通常不標符號)', category: 'tone' },
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

export function findZhuyin(id: string): ZhuyinSymbol | undefined {
  return ZHUYIN_INVENTORY.find((symbol) => symbol.id === id);
}
