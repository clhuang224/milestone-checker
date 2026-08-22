# 待辦

已知但還沒處理的缺口。**做完一項就刪掉那一項**，全部清空就刪掉這個檔案。

規格層級的工作在 `openspec/changes/*/tasks.md`，這裡只放那些沒有對應 change、或跨 change 的漏。

## 缺陷

- [ ] **`record-detail.html` 不依 `body.kind` 分派。** 任何不是警示／報告的頁籤一律渲染 `<app-articulation-table>`。今天無害（只有一張表），但接上 SOAP 或吞嚥表之後會靜默顯示錯的表。
- [ ] **課節建立後不能改掛哪些表。** `session-record.model.ts` 的註解寫 `formIds` 之後可以修改，但畫面上沒有這個入口。要嘛做出來，要嘛改掉註解。
- [ ] **`Case.note` 與 `SessionRecord.note` 沒有畫面。** 示範個案「小切」帶著一句備註，任何地方都看不到。
- [ ] **吞嚥的資料路徑通了，但沒有寫入口。** `Storage` 有了 `SwallowTrial` 集合、`buildFacts()` 也產出 `swallowing.trials`，規則條件可以正常觸發——但除了測試以外沒有東西會建立一筆嘗試。要等吞嚥評估表的畫面（見下）。

## 要開發者決定

- [ ] **構音格子表的「由左至右部位由前到後」對不上實際欄序。** 實際是 雙唇 → 齒槽 → 舌根 → 舌面 → 舌尖後 → 舌尖前，舌根排第三欄之後又回到舌面／舌尖，不是單調由前到後。是欄序要改、說明文字要改，還是這個排法本來就是臨床慣例而說明文字才是問題。
- [ ] **矯正年齡的兩個常數**（`FULL_TERM_WEEKS = 40`、`CORRECTION_APPLIES_UNTIL_MONTHS = 24`）是模型生成的，待確認或改成可設定。細節在 `references/open-questions.md`。
- [ ] `references/open-questions.md` 裡其餘的臨床待議事項:聲調、邊音化與 ㄋ／ㄌ 互換、介音省略的推導、擦音化的例子、前置化／後置化的對照表、蒟蒻果凍的標記、台灣本土食物的等級。

## 沒做完的規格

- [ ] **梅姐（成人中風個案）的種子資料**還沒建。
- [ ] SOAP 治療紀錄表:表單本體與畫面。
- [ ] 吞嚥評估表:畫面（核心邏輯已在 `core/swallowing/`）。
- [ ] `itemList` 表:表單本體，以及評估表一覽裡編輯項目與條件的介面。
- [ ] `add-demo-case-seeds` 的 3.4:瀏覽器確認第一次開啟就看得到個案、警示與報告草稿。
- [ ] `openspec/specs/` 還是空的，第一輪 change 都還沒 archive。
