import { Rule } from '../models/rule.model';

/**
 * Only the referral rule survives. The others referenced the nine model-generated findings that
 * were discarded with the arrival of assessment forms; this one reads case age and articulation
 * errors, neither of which is an item on a form.
 */
export const STARTER_RULES: Rule[] = [
  {
    id: 'rule-articulation-therapy-referral',
    name: '四歲以上仍有捲舌音以外的構音錯誤',
    condition: {
      and: [
        { '>': [{ var: 'case.ageInMonths' }, 48] },
        {
          // 「排除」是存在型:扣掉 ㄓㄔㄕㄖ 之後仍然有其他錯誤才成立，不是「完全沒有捲舌音錯誤」。
          some: [
            { var: 'articulation.errors' },
            { '!': { in: [{ var: 'targetPhonemeId' }, ['zh', 'ch', 'sh', 'r']] } },
          ],
        },
      ],
    },
    action: {
      message: '四歲以上仍有捲舌音以外的構音錯誤，建議安排構音治療',
      severity: 'warning',
      reportTemplate: '個案已滿四歲，構音記錄顯示捲舌音以外仍有錯誤音，建議安排構音治療。',
    },
    enabled: true,
  },
  {
    id: 'rule-taiwanese-dialect-influence-demo',
    name: '示範：台灣台語的方言影響',
    // Written in exactly the shape toJsonLogic() emits for two set rows (nativeLanguage includes
    // taiwanese AND articulationTarget includes sh/f/yu), so the editor reads it back as rows.
    //
    // The condition is broader than the message on purpose: a condition row can ask which target
    // sound erred but not what it was replaced by, so a child saying ㄕ as ㄉ also matches. This is
    // accepted; do not extend the condition vocabulary to close the gap.
    condition: {
      and: [
        { some: [{ var: 'case.nativeLanguages' }, { in: [{ var: '' }, ['taiwanese']] }] },
        {
          some: [
            { var: 'articulation.errors' },
            { in: [{ var: 'targetPhonemeId' }, ['sh', 'f', 'yu']] },
          ],
        },
      ],
    },
    action: {
      message:
        '（示範規則，可依需要修改或刪除）個案母語包含台灣台語，ㄕ、ㄈ、ㄩ 的錯誤可能是受台灣台語影響的語言差異，不一定是異常，例如石頭說成俗頭（ㄕ 替代成 ㄙ）、飛機說成灰機（ㄈ 替代成 ㄏ）、萵苣說成萵記（ㄩ 替代成 ㄧ）。',
      severity: 'info',
    },
    enabled: true,
  },
];
