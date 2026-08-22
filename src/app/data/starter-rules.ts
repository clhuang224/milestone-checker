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
];
