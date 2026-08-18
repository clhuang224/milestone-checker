# 任務:add-articulation-rule-conditions

## 1. 個案生日

- [x] 1.1 `models/case.model.ts` 的 `Case` 新增 `birthDateISO?: string`
- [x] 1.2 新增 `ageInMonthsOn(birthDateISO, onDateISO)` 與顯示用的「X 歲 Y 個月」格式化，含單元測試（跨月、生日當天、未來日期）
- [x] 1.3 個案建立/編輯表單加日期輸入，旁邊即時顯示推算年齡

## 2. 規則事實

- [x] 2.1 新增 `core/rule-engine/facts.ts`——`buildFacts()` 組出 `{ ...values, case, articulation }`，觀察項目維持平鋪在頂層
- [x] 2.2 `errors` 只收真正的錯誤（用 `isArticulationError()`），✓ 不進去;帶 `targetCategory` 供日後收斂用
- [x] 2.3 `evaluateCondition()` 改吃事實物件，欄位存在性檢查支援 `case.ageInMonths` 這種點路徑，且只套用在數值/布林條件列
- [x] 2.4 `features/cases/case-detail` 改用 `buildFacts()` 餵 `evaluateRules()`
- [x] 2.5 單元測試:✓ 不算錯誤、生日未填時規則不觸發、既有觀察項目規則不受影響

## 3. 適用條件

- [x] 3.1 `condition-mapper.ts` 新增 `ConditionSetRow` 與 `toJsonLogic` 的 `some`/`in`/`!` 對應
- [x] 3.2 `fromJsonLogic()` 能把這些形狀反解回 `ConditionSetRow`（匯入與編輯都靠它）
- [x] 3.3 單元測試:來回轉換、「排除」的存在型語意、`articulationProcess` 的巢狀 `some`

## 4. 規則編輯器

- [ ] 4.1 條件欄位來源改成 `RuleField`（月齡 ＋ 觀察項目），`RuleEditor`/`ConditionEditor` 跟著換型別
- [ ] 4.2 條件編輯器支援新增「適用條件」列:對象 × 包含/排除 × 多選項目
- [ ] 4.3 UI 文案寫明「排除」＝扣掉這些之後仍有其他錯誤，不是「完全沒有」
- [ ] 4.4 元件測試:建立含適用條件的規則、編輯既有規則時能還原成適用條件列

## 5. 移除錯誤音數

- [ ] 5.1 `data/starter-findings.ts` 刪除 `articulationErrorCount`
- [ ] 5.2 `data/starter-rules.ts` 的 `rule-speech-intelligibility` 拆掉數量那一支，訊息文字一併改
- [ ] 5.3 更新 `data/starter-content.spec.ts` 相關斷言

## 6. 新的預設規則

- [ ] 6.1 `starter-rules.ts` 新增「四歲以上仍有捲舌音以外的構音錯誤」，標為佔位待審核
- [ ] 6.2 單元測試:小切的資料會觸發、只有 ㄓㄔㄕㄖ 錯誤時不觸發

## 7. 收尾

- [ ] 7.1 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [ ] 7.2 e2e 補小切場景（生日由執行日回推，不寫死），確認警示真的跳出來
- [ ] 7.3 治療師審核新增的預設規則（審核關卡，故意留著不打勾）
