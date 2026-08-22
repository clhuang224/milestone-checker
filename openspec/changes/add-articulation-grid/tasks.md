# 任務:add-articulation-grid

## 1. 推導核心

- [x] 1.1 `core/articulation/parse-heard.ts`——取第一個注音符號、辨識緊接的上標 `ⁿ`、解析失敗回空結果
- [x] 1.2 `core/articulation/derive-processes.ts`——依推導條件比對辨異徵性，回傳所有命中的歷程 id
- [x] 1.3 `applicableProcessIds(targetPhonemeId)`——拿目標音跟所有符號配對跑推導，得出可能出現的歷程
- [x] 1.4 單元測試涵蓋十條歷程的判準、一筆中多條、以及解析的邊界情況

## 2. 資料模型

- [ ] 2.1 `models/articulation-record.model.ts` 改成 `ArticulationProbe` 與 `ProbeItem`
- [ ] 2.2 新增 `PhonologicalSummary`（`useDerived` ＋ 手動歸納）
- [ ] 2.3 `storage.ts` 換掉音對的 CRUD，新增 summary 的讀寫;key 升到 v4
- [ ] 2.4 storage 測試跟著改

## 3. 事實與規則

- [ ] 3.1 `buildFacts()` 改由 probes 產生 `articulation.errors`，`processIds` 取當前生效的歸納
- [ ] 3.2 確認既有的適用條件規則不用改寫
- [ ] 3.3 單元測試:推導與手動兩種模式下規則觸發結果正確

## 4. 格子表

- [ ] 4.1 注音表分欄資料（聲母六欄，韻母/介音/聲調各自成區）
- [ ] 4.2 `articulation-table` 改成格子表，每格三組「目標詞 ＋ 錯音」直向堆疊
- [ ] 4.3 元件測試:填入錯音會存下來、留白視為正確

## 5. 歷程區塊

- [ ] 5.1 推導結果呈現成「歷程:音 音 音」
- [ ] 5.2 「使用推導結果／自己選」切換;自己選時給空白區塊
- [ ] 5.3 手動挑選時過濾掉對該目標音不可能的歷程
- [ ] 5.4 元件測試:切換、覆寫、切回自動

## 6. 示範資料與收尾

- [ ] 6.1 小切的資料改成 probe 形式
- [ ] 6.2 `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm check:references` 全過
- [ ] 6.3 e2e 更新到新的格子表
- [ ] 6.4 瀏覽器確認格子表在一般筆電寬度下不需要橫向捲動
