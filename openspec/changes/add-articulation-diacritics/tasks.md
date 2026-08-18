# 任務:add-articulation-diacritics

## 1. 資料模型

- [x] 1.1 `models/articulation-record.model.ts` 新增 `ArticulationDiacritic` 型別與 `ArticulationSubstitution.errorDiacritic` 選填欄位

## 2. 顯示邏輯

- [x] 2.1 `features/articulation/substitution-label.ts`——底音改成 `errorPhonemeId ?? targetPhonemeId`，附加符號接 U+207F `ⁿ`;兩個欄位都空才回 `✓`
- [x] 2.2 單元測試涵蓋四種組合（✓／純替代／純鼻音化／替代＋鼻音化）

## 3. 參考資料

- [x] 3.1 `data/zhuyin-inventory.ts` 補空韻 `ㄭ`（U+312D）到 `FINALS` 尾端，不附 `features`
- [x] 3.2 `data/starter-articulation-processes.ts` 補 `vowelNasalization`「母音鼻音化」與 `diphthongReduction`「複韻母簡化」，沿用 `PLACEHOLDER_NOTE`
- [x] 3.3 更新 `data/articulation-content.spec.ts` 的符號/歷程數量斷言

## 4. 介面

- [x] 4.1 `features/articulation/articulation-table`——錯誤音下拉旁加「鼻音化」checkbox，`SubstitutionDraft` 帶 `errorDiacritic` 並在 `save()` 寫入
- [x] 4.2 確認音韻歷程總覽把「只有附加符號」的音對正確歸類（不再被當成 ✓ 濾掉）
- [x] 4.3 元件測試:只勾鼻音化的音對會顯示 `ㄧ→ㄧⁿ` 且不被當成正確音

## 5. 收尾

- [x] 5.1 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [x] 5.2 瀏覽器手動確認上標在構音表與音韻歷程總覽顯示正確
- [ ] 5.3 治療師審核新增的兩個預設音韻歷程（審核關卡，故意留著不打勾）
