# 任務清單

## 1. 專案骨架

- [x] 1.1 在這個資料夾裡跑 `ng new` 建立 Angular App(standalone、zoneless/Signals、routing、Tailwind)——Angular 21.2,已驗證 `ng build` 跟開發伺服器都正常
- [x] 1.2 設定 Vitest(取代預設的 Jasmine/Karma)——原生 `--test-runner=vitest`,已驗證 `ng test` 通過
- [x] 1.3 確認 `tsconfig` 有開 `strict: true`(對應全域 CLAUDE.md)——已確認
- [x] 1.4 設定好 ESLint/Prettier(或 Angular 內建的等效工具)——Prettier 已隨 scaffold 內建;ESLint 已用 `angular-eslint` 官方 schematic 補上(`pnpm lint` 通過)

## 2. 資料結構與資料儲存(取代舊的家長打勾清單模型)

- [x] 2.1 移除 `models/milestone.model.ts`(舊構想留下的型別,這次的方向不會用到)
- [x] 2.2 寫 `models/finding.model.ts`(`FindingDefinition`、`FindingKind`)
- [x] 2.3 寫 `models/case.model.ts`(`Case`、`CaseProfile`)
- [x] 2.4 寫 `models/rule.model.ts`(`Rule`、`RuleAction`、`JsonLogicRule`)
- [x] 2.5 把 `core/storage/storage.ts` 換掉包裝的型別跟 key(`therapist-rule-engine:findings:v1` / `:cases:v1` / `:rules:v1`),保留既有的命名空間+版號+壞資料 fallback 機制
- [x] 2.6 `StorageService` 單元測試改成新型別(沿用既有涵蓋範圍:新增/更新/清除、資料損毀時的 fallback)——11 個測試全過

## 3. 規則引擎核心

- [x] 3.1 安裝 `json-logic-js`(或 `json-logic-engine`)並確認型別可用——裝了 `json-logic-js` + `@types/json-logic-js`
- [x] 3.2 `core/rule-engine/json-logic.ts`——包一層評估函式:給定 `CaseProfile.values` 攤平成 facts、套用 `Rule.condition`,回傳布林
- [x] 3.3 `core/rule-engine/condition-mapper.ts`——內部「條件列/群組」模型 ⇄ `JsonLogicRule` 互轉
- [x] 3.4 上述兩者的單元測試(Vitest):evaluation 的正確性、mapper 的 round-trip——24 個測試全過

## 4. 範例內容(先當佔位,需要審核)

- [ ] 4.1 草擬一小批語言/言語/吞嚥的範例 `FindingDefinition`(觀察項目/評估分數欄位)
- [ ] 4.2 草擬一小批範例 `Rule`(條件 + 警示文字 + 報告範本片段),每一條都附 `sourceNote`,清楚標示是佔位/示意用
- [ ] 4.3 **使用者審核關卡**:在把這些規則當真之前,先給治療師本人確認/替換過——這一步需要專業判斷,不能自動放行

## 5. 介面

- [ ] 5.1 `DisclaimerBanner` 元件(常駐顯示「僅供臨床參考,不取代專業判斷」,不是點掉一次就沒了的那種提示)
- [ ] 5.2 `features/cases`——個案清單、建立/切換個案
- [ ] 5.3 `features/findings`——單一個案的觀察/評估項目填寫表單(勾選 + 數值,依類別分組)
- [ ] 5.4 `features/rules/rule-list`——規則清單(啟用/停用、編輯、刪除)
- [ ] 5.5 `features/rules/rule-editor`——條件列 + AND/OR 群組編輯器
- [ ] 5.6 `features/rules/rule-import-export`——匯出/匯入 JsonLogic 規則集 JSON 檔(匯入要做基本結構檢查,失敗要有清楚錯誤訊息)
- [ ] 5.7 `features/warnings`——目前個案被觸發的規則清單(依 severity 呈現)
- [ ] 5.8 `features/report-draft`——組出報告文字草稿 + 複製按鈕
- [ ] 5.9 視覺風格調整(Tailwind 主題、配色、間距)——工具/專業取向,不用刻意童趣化

## 6. 測試與收尾

- [ ] 6.1 主要元件的 smoke test(Vitest)
- [ ] 6.2 手動測一輪完整流程:建立個案 → 填觀察項目 → 編輯規則 → 觸發警示 → 產生報告草稿 → 重新整理頁面資料還在
- [ ] 6.3 這個 change 功能完成後,更新 README 的「目前狀態」段落

## 7. 收尾

- [ ] 7.1 完成後把這個 OpenSpec change 存檔(archive)(`openspec/specs/rule-engine/` 會變成定案的規格)
- [ ] 7.2 把後續想法(報告匯出 PDF/Word、多治療師協作、其他治療領域規則範本)記下來當作未來 change 的候選項,這次不做
