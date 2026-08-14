import { FindingDefinition } from '../models/finding.model';

/**
 * 示意用佔位資料——內容尚未經治療師審核，正式使用前必須由治療師本人確認、修改或整批替換
 * （對應 tasks.md 4.3 的審核關卡）。
 */
export const STARTER_FINDINGS: FindingDefinition[] = [
  {
    id: 'expressiveVocabDelay',
    categoryId: 'language',
    label: '表達性詞彙量明顯落後同齡',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'limitedSentenceLength',
    categoryId: 'language',
    label: '句長明顯短於同齡（電報式語言）',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'receptiveLanguageScore',
    categoryId: 'language',
    label: '語言理解評估分數',
    kind: 'number',
    unit: '分',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'articulationErrorCount',
    categoryId: 'speech',
    label: '構音錯誤音數',
    kind: 'number',
    unit: '個音',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'unintelligibleToStrangers',
    categoryId: 'speech',
    label: '不熟悉的人難以聽懂其說話內容',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'stutteringObserved',
    categoryId: 'speech',
    label: '觀察到口吃/言語不流暢',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'drooling',
    categoryId: 'swallowing',
    label: '進食時或平時有流口水情形',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'coughingDuringMeals',
    categoryId: 'swallowing',
    label: '進食中出現嗆咳',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'prolongedMealTime',
    categoryId: 'swallowing',
    label: '單餐進食時間明顯過長（超過 30 分鐘）',
    kind: 'boolean',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'oralMotorScore',
    categoryId: 'swallowing',
    label: '口腔動作評估分數',
    kind: 'number',
    unit: '分',
    sourceNote: '佔位資料，待治療師審核後替換為實際臨床判斷依據',
  },
];
