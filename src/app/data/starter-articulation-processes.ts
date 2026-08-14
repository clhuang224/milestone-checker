import { PhonologicalProcessDefinition } from '../models/phonological-process.model';

const PLACEHOLDER_NOTE = '佔位資料，待治療師審核後替換為實際臨床判斷依據';

/**
 * 示意用佔位資料——內容尚未經治療師審核，正式使用前必須由治療師本人確認、修改或整批替換
 * （對應 tasks.md 6.1 的審核關卡）。`description` 只是貼標籤時的參考說明，系統不會依這些
 * 說明自動判斷某個音對屬於哪個歷程。
 */
export const STARTER_ARTICULATION_PROCESSES: PhonologicalProcessDefinition[] = [
  {
    id: 'deaspiration',
    name: '不送氣化',
    description: '送氣音被不送氣音替代，如 ㄆ→ㄅ、ㄊ→ㄉ',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'fronting',
    name: '前置化',
    description: '構音部位往前移，如 ㄍ→ㄉ（舌根音變舌尖音）',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'backing',
    name: '後置化',
    description: '構音部位往後移，如 ㄉ→ㄍ（舌尖音變舌根音）',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'stopping',
    name: '塞音化',
    description: '擦音或塞擦音被塞音替代，如 ㄙ→ㄉ',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'affrication',
    name: '塞擦音化',
    description: '擦音被塞擦音替代，如 ㄒ→ㄑ',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'deretroflexion',
    name: '捲舌音舌尖化',
    description: '捲舌音被舌尖前音替代，如 ㄓ→ㄗ、ㄕ→ㄙ',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'nasalLateralConfusion',
    name: '邊音化（ㄋ/ㄌ 混淆）',
    description: 'ㄋ 與 ㄌ 互相替代或混用',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'nasalFinalReduction',
    name: '聲隨韻母簡化',
    description: '聲隨韻母的鼻音被省略或簡化，如 ㄤ→ㄚ',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'medialDeletion',
    name: '介音省略',
    description: '省略介音，如 ㄧㄠ→ㄠ',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
  {
    id: 'toneConfusion',
    name: '聲調混淆',
    description: '聲調使用錯誤，如三聲念成二聲',
    builtin: true,
    sourceNote: PLACEHOLDER_NOTE,
  },
];
