import { FindingDefinition } from '../models/finding.model';

export const STARTER_FINDINGS: FindingDefinition[] = [
  {
    id: 'expressiveVocabDelay',
    categoryId: 'language',
    label: '表達性詞彙量明顯落後同齡',
    kind: 'boolean',
  },
  {
    id: 'limitedSentenceLength',
    categoryId: 'language',
    label: '句長明顯短於同齡（電報式語言）',
    kind: 'boolean',
  },
  {
    id: 'receptiveLanguageScore',
    categoryId: 'language',
    label: '語言理解評估分數',
    kind: 'number',
    unit: '分',
  },
  {
    id: 'unintelligibleToStrangers',
    categoryId: 'speech',
    label: '不熟悉的人難以聽懂其說話內容',
    kind: 'boolean',
  },
  {
    id: 'stutteringObserved',
    categoryId: 'speech',
    label: '觀察到口吃/言語不流暢',
    kind: 'boolean',
  },
  {
    id: 'drooling',
    categoryId: 'swallowing',
    label: '進食時或平時有流口水情形',
    kind: 'boolean',
  },
  {
    id: 'coughingDuringMeals',
    categoryId: 'swallowing',
    label: '進食中出現嗆咳',
    kind: 'boolean',
  },
  {
    id: 'prolongedMealTime',
    categoryId: 'swallowing',
    label: '單餐進食時間明顯過長（超過 30 分鐘）',
    kind: 'boolean',
  },
  {
    id: 'oralMotorScore',
    categoryId: 'swallowing',
    label: '口腔動作評估分數',
    kind: 'number',
    unit: '分',
  },
];
