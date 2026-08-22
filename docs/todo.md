# 待辦

已知但還沒處理的缺口。**做完一項就刪掉那一項**，全部清空就刪掉這個檔案。

規格層級的工作在 `openspec/changes/*/tasks.md`，這裡只放那些沒有對應 change、或跨 change 的漏。

## 缺陷

- [ ] **吞嚥的 trial 條件永遠不會成立。** 型別、成功率計算、預設目錄、規則編輯器的 trial 條件列都在，但 `Storage` 沒有 `SwallowTrial` 的集合，`buildFacts()` 也不產生 `swallowing.trials` 命名空間。寫得出條件，但它不會觸發。
- [ ] **報告草稿沒有被連動刪除。** `removeCase()` 與 `removeRecord()` 清了 profile、音對、歷程覆寫，但沒清 `REPORTS_KEY`，刪掉個案之後草稿會留在 `localStorage` 裡。
- [ ] **`record-detail.html` 不依 `body.kind` 分派。** 任何不是警示／報告的頁籤一律渲染 `<app-articulation-table>`。今天無害（只有一張表），但接上 SOAP 或吞嚥表之後會靜默顯示錯的表。
- [ ] **課節建立後不能改掛哪些表。** `session-record.model.ts` 的註解寫 `formIds` 之後可以修改，但畫面上沒有這個入口。要嘛做出來，要嘛改掉註解。
- [ ] **`e2e/articulation-smoke.mjs` 對不上現在的畫面。** 它點「＋ 新增評估」（已改名「＋ 新增課節紀錄」）、找「構音記錄」連結（已改名「構音評估表」）、在個案頁上讀警示與報告（已移進課節紀錄頁的頁籤）。`add-session-records` 的 8.3 勾了但實際沒改。
- [ ] **沒有插入 `ⁿ` 的方式。** 鼻音化的上標是 `parse-heard.ts` 要求的記法，但畫面上沒有按鈕也沒有選單，使用說明只好叫人自己複製字元。
- [ ] **`Case.note` 與 `SessionRecord.note` 沒有畫面。** 示範個案「小切」帶著一句備註，任何地方都看不到。

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
- [ ] `add-articulation-grid/design.md` 仍寫著前置化／後置化用 `PLACE_ORDER` 索引推導，那個做法後來被 `references/taiwan-mandarin-consonants.md` 推翻，design 沒有回頭改。

## 流程上的洞

- [ ] **CI 不跑 `check:references`。** 只有 `.husky/pre-commit` 在擋，所以 `--no-verify` 就繞過了臨床資料漂移的唯一守門。
