import { Rule } from '../models/rule.model';

/**
 * 示意用佔位規則——條件組合跟警示文字都尚未經治療師審核，正式使用前必須由治療師本人
 * 確認、修改或整批替換（對應 tasks.md 4.3 的審核關卡），不能當作已驗證的臨床邏輯使用。
 */
export const STARTER_RULES: Rule[] = [
  {
    id: 'rule-swallowing-drooling-coughing',
    name: '流口水合併嗆咳',
    condition: {
      and: [
        { '==': [{ var: 'drooling' }, true] },
        { '==': [{ var: 'coughingDuringMeals' }, true] },
      ],
    },
    action: {
      message: '同時觀察到流口水與進食嗆咳，建議轉介進一步吞嚥功能評估',
      severity: 'warning',
      reportTemplate: '個案於進食過程中觀察到流口水合併嗆咳情形，建議安排進一步吞嚥功能評估。',
    },
    enabled: true,
    sourceNote: '佔位規則，待治療師審核後替換為實際臨床判斷依據',
  },
  {
    id: 'rule-swallowing-oral-motor-low',
    name: '口腔動作評估分數偏低',
    condition: { '<': [{ var: 'oralMotorScore' }, 40] },
    action: {
      message: '口腔動作評估分數偏低，建議持續追蹤',
      severity: 'info',
      reportTemplate:
        '個案口腔動作評估分數為 {{value:oralMotorScore}} 分，低於參考門檻，建議持續追蹤。',
    },
    enabled: true,
    sourceNote: '佔位規則，待治療師審核後替換為實際臨床判斷依據（門檻值 40 分僅為示意）',
  },
  {
    id: 'rule-speech-intelligibility',
    name: '構音清晰度疑慮',
    condition: {
      or: [
        { '>': [{ var: 'articulationErrorCount' }, 3] },
        { '==': [{ var: 'unintelligibleToStrangers' }, true] },
      ],
    },
    action: {
      message: '構音錯誤音數偏多或不熟悉的人難以理解，建議安排構音評估',
      severity: 'warning',
      reportTemplate: '個案構音清晰度顯示疑慮，建議安排正式構音評估。',
    },
    enabled: true,
    sourceNote: '佔位規則，待治療師審核後替換為實際臨床判斷依據（門檻值 3 個音僅為示意）',
  },
  {
    id: 'rule-language-expression-delay',
    name: '語言表達能力落後',
    condition: {
      and: [
        { '==': [{ var: 'limitedSentenceLength' }, true] },
        { '==': [{ var: 'expressiveVocabDelay' }, true] },
      ],
    },
    action: {
      message: '句長偏短合併詞彙量落後，建議進一步語言評估',
      severity: 'warning',
      reportTemplate: '個案表現出句長偏短合併表達性詞彙量落後，建議安排進一步語言發展評估。',
    },
    enabled: true,
    sourceNote: '佔位規則，待治療師審核後替換為實際臨床判斷依據',
  },
];
