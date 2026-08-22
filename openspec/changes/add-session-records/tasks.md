# 任務:add-session-records

## 1. 資料模型

- [x] 1.1 `Assessment` 改名 `SessionRecord`，`assessedOnISODate` 改名 `onISODate`，新增 `formIds`
- [x] 1.2 新增 `AssessmentFormDefinition` 與 `FormBody`
- [x] 1.3 各表內容的外鍵由 `assessmentId` 改名 `recordId`
- [x] 1.4 移除 `FindingDefinition.categoryId`

## 2. 儲存與種子

- [x] 2.1 `storage.ts` 的 key 升到 v5;assessments 改成 sessionRecords，新增表目錄集合
- [x] 2.2 刪除既有九個觀察項目的種子
- [x] 2.3 種子加入內建的構音評估表
- [x] 2.4 示範個案改成一筆課節紀錄，掛構音評估表
- [x] 2.5 storage 測試跟著改，含連動刪除

## 3. 事實與規則

- [x] 3.1 `buildFacts()` 改收 `SessionRecord`
- [x] 3.2 確認項目 id 仍平鋪在事實最上層，既有規則不用改寫
- [x] 3.3 `{{assessment.date}}` 佔位符沿用或改名，兩者擇一並更新報告草稿測試

## 4. 個案頁

- [x] 4.1 基本資料改成可收起，預設收起
- [x] 4.2 課節紀錄表格:日期、內容、當時年齡、重點
- [x] 4.3 「新增課節紀錄」流程含勾選要掛哪幾張表，至少一張
- [x] 4.4 元件測試:表格欄位、年齡以紀錄日計算、至少一張表的限制

## 5. 紀錄頁

- [x] 5.1 頁首:個案、日期、當時年齡
- [x] 5.2 路由式頁籤，一張表一條路由 `/cases/:caseId/records/:recordId/forms/:formId`
- [x] 5.3 構音表接進頁籤，維持滿版寬度不被側欄擠窄
- [x] 5.4 警示與報告草稿各成一個頁籤，掛在紀錄層級
- [x] 5.5 元件測試:切換頁籤不掉資料、未掛的表不出現

## 6. 導覽

- [x] 6.1 頂層改成 個案一覽 / 評估表一覽
- [x] 6.2 評估表一覽:列出各表與掛載數，最上面釘一列跨表規則
- [x] 6.3 `/rules` 與 `/articulation-processes` 保留為 redirect，不要 404

## 7. 修掉既有缺陷

- [x] 7.1 報告草稿切換紀錄時會換內容（目前卡在第一次的值）
- [x] 7.2 報告草稿存檔，保留手改的內容
- [x] 7.3 「重新產生」不靜默覆蓋手改的內容

## 8. 文件與收尾

- [x] 8.1 `CLAUDE.md` 的「範圍限定在語言/言語/吞嚥」改寫成「只做目前有的表」
- [x] 8.2 `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm check:references` 全過
- [x] 8.3 e2e 更新到新動線
- [x] 8.4 瀏覽器確認構音格子表在紀錄頁裡仍是六欄不 wrap
