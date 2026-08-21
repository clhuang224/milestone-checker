import { PhonologicalProcessDefinition } from '../models/phonological-process.model';

/**
 * 貼標籤時可以挑的分類清單。內容見 `references/phonological-processes.md`。
 */
export const STARTER_ARTICULATION_PROCESSES: PhonologicalProcessDefinition[] = [
  {
    id: 'deaspiration',
    name: '不送氣化',
    description: '送氣音被不送氣音替代，如 ㄆ→ㄅ、ㄊ→ㄉ',
    builtin: true,
  },
  {
    id: 'fronting',
    name: '前置化',
    description: '構音部位往前移，如 ㄍ→ㄉ（舌根音變舌尖音）',
    builtin: true,
  },
  {
    id: 'backing',
    name: '後置化',
    description: '構音部位往後移，如 ㄉ→ㄍ（舌尖音變舌根音）',
    builtin: true,
  },
  {
    id: 'stopping',
    name: '塞音化',
    description: '擦音或塞擦音被塞音替代，如 ㄙ→ㄉ',
    builtin: true,
  },
  {
    id: 'affrication',
    name: '塞擦音化',
    description: '擦音被塞擦音替代，如 ㄒ→ㄑ',
    builtin: true,
  },
  {
    id: 'deretroflexion',
    name: '捲舌音舌尖化',
    description: '捲舌音被舌尖前音替代，如 ㄓ→ㄗ、ㄕ→ㄙ',
    builtin: true,
  },
  {
    id: 'nasalLateralConfusion',
    name: '邊音化（ㄋ/ㄌ 混淆）',
    description: 'ㄋ 與 ㄌ 互相替代或混用',
    builtin: true,
  },
  {
    id: 'nasalFinalReduction',
    name: '聲隨韻母簡化',
    description: '聲隨韻母的鼻音被省略或簡化，如 ㄤ→ㄚ',
    builtin: true,
  },
  {
    id: 'medialDeletion',
    name: '介音省略',
    description: '省略介音，如 ㄧㄠ→ㄠ',
    builtin: true,
  },
  {
    id: 'toneConfusion',
    name: '聲調混淆',
    description: '聲調使用錯誤，如三聲念成二聲',
    builtin: true,
  },
  {
    id: 'vowelNasalization',
    name: '母音鼻音化',
    description: '母音帶上鼻音成分，如 ㄧ→ㄧⁿ、ㄨ→ㄨⁿ',
    builtin: true,
  },
  {
    id: 'diphthongReduction',
    name: '複韻母簡化',
    description: '複韻母失去介音或韻尾，如 ㄞ→ㄚ',
    builtin: true,
  },
];
