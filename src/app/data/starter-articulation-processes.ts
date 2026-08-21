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
    description: '構音部位往前移，如 ㄍ→ㄉ（舌根音變齒槽音）、ㄓ→ㄗ（舌尖後音變舌尖前音）',
    builtin: true,
  },
  {
    id: 'backing',
    name: '後置化',
    description: '構音部位往後移，如 ㄉ→ㄍ（齒槽音變舌根音）',
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
    id: 'fricativization',
    name: '擦音化',
    description: '塞音或塞擦音被擦音替代',
    builtin: true,
  },
  {
    id: 'nasalFinalReduction',
    name: '鼻音聲隨韻母簡化',
    description: '鼻音聲隨韻母的鼻音被省略，如 ㄤ→ㄚ',
    builtin: true,
  },
  {
    id: 'medialDeletion',
    name: '介音省略',
    description: '省略介音，如 ㄧㄠ→ㄠ',
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
    description: '複韻母失去韻尾，如 ㄞ→ㄚ',
    builtin: true,
  },
];
