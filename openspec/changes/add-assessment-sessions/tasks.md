# 任務:add-assessment-sessions

## 1. 年齡基準

- [x] 1.1 `core/age.ts` 新增 `correctedAgeInMonthsOn()`，足月定義與 24 個月適用期上限都標成待審核的佔位常數
- [x] 1.2 單元測試:足月不調整、32 週調整 8 週、超過上限回實齡、沒填週數等於實齡、無效生日回 undefined
- [x] 1.3 `models/case.model.ts` 的 `Case` 新增 `gestationalWeeks?: number`

## 2. 評估場次

- [x] 2.1 新增 `models/assessment.model.ts`
- [x] 2.2 `CaseProfile` 改名 `AssessmentProfile`，key 換成 `assessmentId`
- [x] 2.3 `ArticulationSubstitution` 新增 `assessmentId`，註明 `caseId` 是刻意的反正規化且必須一致
- [x] 2.4 `core/storage/storage.ts` 新增 assessments key 與 CRUD;`removeAssessment` 連動刪除 profile 與音對;`removeCase` 一併刪除場次
- [x] 2.5 storage 單元測試涵蓋上述連動刪除

## 3. 事實與報告

- [x] 3.1 `buildFacts()` 改收 `Assessment`，日期取 `assessedOnISODate`
- [x] 3.2 事實的 `case` 命名空間同時提供 `ageInMonths` 與 `correctedAgeInMonths`
- [x] 3.3 `ruleFields()` 加入矯正月齡，規則編輯器選得到
- [x] 3.4 `report-draft.ts` 支援 `{{assessment.date}}`
- [x] 3.5 單元測試:同一個案兩次不同日期的評估算出不同年齡

## 4. 介面

- [x] 4.1 個案頁加評估場次選擇器與「新增評估」，選到的場次驅動觀察表單、警示、報告草稿
- [x] 4.2 個案建立/編輯表單加出生週數，旁邊顯示推算的矯正年齡
- [x] 4.3 構音記錄頁跟著選到的場次走
- [x] 4.4 元件測試:切換場次會換掉觀察表單內容

## 5. 資料版號與示範資料

- [x] 5.1 `localStorage` key 升到 v3
- [x] 5.2 `data/starter-cases.ts` 的小切補一筆評估場次，日期＝ seed 當日
- [x] 5.3 更新示範資料的測試

## 6. 收尾

- [x] 6.1 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [x] 6.2 e2e 補:建立個案填生日與出生週數 → 兩次不同日期的評估 → 年齡不同、規則觸發狀況跟著變
- [ ] 6.3 治療師審核足月定義與矯正年齡適用期上限（審核關卡，故意留著不打勾）
