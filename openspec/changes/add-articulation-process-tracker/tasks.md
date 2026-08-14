# 任務清單

## 1. 資料模型

- [x] 1.1 寫 `models/zhuyin.model.ts`(`ZhuyinCategory`、`ArticulationFeatures`、`ZhuyinSymbol`)——另外拉出 `Aspiration` 型別，`features` 的三個欄位都設成必填（只有 `features` 本身選填，對應「只有聲母有特徵」）
- [x] 1.2 寫 `models/phonological-process.model.ts`(`PhonologicalProcessDefinition`)
- [x] 1.3 寫 `models/articulation-record.model.ts`(`WordExample`、`ArticulationSubstitution`)

## 2. 靜態參考資料

- [x] 2.1 `data/zhuyin-inventory.ts`——依教育部標準順序的 37 個注音符號 + 5 個聲調，聲母附掛部位/方式/送氣特徵（依 `design.md` 草案表，若審核時有調整以審核結果為準）;`order` 由陣列位置自動編號，避免手動編號編錯;另外附 `ZHUYIN_CATEGORY_LABELS`/`ZHUYIN_CATEGORY_ORDER`/`findZhuyin()` 給之後的畫面用。聲調另外加了 `label`（model 補一個選填欄位），否則表格會是一排幾乎看不出差別的符號
- [x] 2.2 `data/starter-articulation-processes.ts`——音韻歷程預設清單（佔位，每筆都要有標示「待審核」的 `sourceNote`），10 筆
- [x] 2.3 單元測試:注音參考表的 id 不重複、排序覆蓋 4 個類別、聲母都有 features 而韻母/聲調沒有;預設音韻歷程清單的 id 不重複、都有 `sourceNote`——`data/articulation-content.spec.ts`，16 個測試全過

## 3. 儲存

- [x] 3.1 `StorageService` 新增 `articulation-processes` / `articulation-records` 兩個 key(`therapist-rule-engine:articulation-processes:v1`、`therapist-rule-engine:articulation-records:v1`)，沿用既有命名空間+版號+壞資料 fallback 機制
- [x] 3.2 音韻歷程目錄用 `starter-articulation-processes.ts` 做初始 seed，支援 upsert/delete（比照 findings 目錄的做法——seed 一樣放在 `App` 的 constructor）;刪除歷程時會順便把還掛著這個標籤的音對解除標記，免得總覽畫面依一個已不存在的歷程分組
- [x] 3.3 構音音對記錄支援依 `caseId` 篩選、新增/編輯/刪除單筆 `ArticulationSubstitution`;`removeCase` 也一併刪掉該個案的音對（比照既有 profile 的 cascade）
- [x] 3.4 上述儲存邏輯的單元測試(Vitest)——`ng test` 61 個測試全過

> 註:測試要用 `pnpm test` / `ng test` 跑，直接跑 `pnpm exec vitest run` 會缺少 Angular 的測試環境設定，用到 `localStorage`/`TestBed` 的測試會炸。

## 4. 介面

- [x] 4.1 `features/articulation/articulation-table`——依 `zhuyin-inventory.ts` 順序列出所有列，每列可以展開新增/編輯/刪除音對（正確音固定、錯誤音可留空代表✓、可掛音韻歷程標籤、可掛範例字詞）;獨立成 `cases/:id/articulation` 路由，不塞進本來就很長的個案頁
- [x] 4.2 `features/articulation/process-list`——音韻歷程目錄管理畫面（新增/編輯/刪除，標示 builtin 項目跟自建項目）;掛在 `/articulation-processes`，跟「規則」並列在導覽列
- [x] 4.3 `features/articulation/process-overview`——依音韻歷程分組的總覽畫面，把個案底下所有音對彙總呈現（例如「不送氣化:ㄆ→ㄅ、ㄊ→ㄉ」）;額外多一組「尚未歸類」收還沒貼標籤的錯誤音對，正確音(✓)不列入總覽
- [x] 4.4 在既有的個案畫面（cases/case 詳情）裡加入構音這塊的入口
- [x] 4.5 沿用既有 `DisclaimerBanner`，確認構音相關頁面也看得到警語——警語在 `App` 的外框，所有路由都吃得到

## 5. 測試與收尾

- [x] 5.1 主要元件的 smoke test(Vitest):`articulation-table`、`process-list`、`process-overview`——82 個測試全過;寫測試時抓到一個真的 bug（見下方）
- [x] 5.2 手動測一輪:選個案 → 在表格裡新增幾筆音對（含留空=✓的情況）→ 貼音韻歷程標籤 → 加範例字詞 → 到總覽畫面確認有正確分組 → 重新整理頁面資料還在——用 Playwright 實際開瀏覽器跑過(`e2e/articulation-smoke.mjs`)，ㄆ→ㄅ/ㄊ→ㄉ/ㄉ→ㄍ、ㄅ ✓、未貼標籤的 ㄍ→ㄉ 都正確，總覽分組、編輯帶值、重新整理後資料都在，沒有 console/page error。這次沒抓到新的 bug（兩個 bug 在 5.1 寫測試時就先抓到了）
- [x] 5.3 `ng build` / `ng test` 全過，作為完成的品質門檻（對應 `CLAUDE.md` 的審查慣例）——另外 `ng lint` 也過

### 寫 smoke test 時抓到的 bug（已修）

- 編輯一筆已存在的音對時，「錯誤音」下拉選單會是空白的，沒有帶出已記錄的音。原因是 `<select>` 上的 `[value]` 綁定會早於它底下 `@for` 產生的 `<option>` 執行，設值時選項還不存在。修法:改成每個 `<option>` 自己綁 `[selected]`。
- 順手把 `{{ f.place }}/{{ f.manner }}` 這種在樣板裡串字串的寫法改成在 TS 算好(`featureLabel()`/`exampleLabel()`)，否則 Prettier 換行後畫面上會多出空白（「雙唇/塞音 /送氣」）。

## 6. 收尾

- [ ] 6.1 **使用者審核關卡**:注音參考表的構音特徵草案、音韻歷程預設清單，先給治療師本人確認/修改過，才能當真的內容——這一步需要專業判斷，不能自動放行
- [x] 6.2 更新 README 的「目前狀態」段落
- [ ] 6.3 這個 change 功能完成後 archive（`openspec/specs/articulation-tracker/` 會變成定案的規格）
- [x] 6.4 把「串進規則引擎（月齡/母語 + 音韻歷程 → 建議構音處置）」記錄成下一個 change 的候選（已經寫在 `proposal.md` 的「未來想法」）
