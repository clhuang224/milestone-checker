# 任務:add-report-sections

順序就是執行順序。第 1、2 節卡在 Q1（兩層還是三段）;Q2 只擋 2.1 的標題文字、Q3 只擋 1.2 的順序。第 3 節之後不卡任何問題。

## 1. 資料形狀與組合

- [ ] 1.1 （需 Q1）`models/session-record.model.ts`:`ReportDraftRecord` 的 `text` 改成選填並改寫型別註解（「治療師改過的規則層，undefined 代表沒改過，空字串是合法的覆寫值」），新增 `authoredText?`;註解寫明**舊草稿只有 `text`、讀出來語意正確，所以不升儲存版號**
- [ ] 1.2 （需 Q3）`core/rule-engine/report-draft.ts`:`buildReportDraft()` 職責不變（仍然只組規則那一層），新增一個把兩層接成一份的函式，空的那一層不留下多餘空行;單元測試涵蓋兩層都有、只有手寫、只有規則、兩層都空
- [ ] 1.3 `core/rule-engine/report-draft.spec.ts`:補一則測試釘住「代入值不跑在手寫那一層」（Q8 的預設），測試名稱寫明這是刻意的

## 2. 畫面

- [ ] 2.1 （需 Q1／Q2）`features/report-draft/`:拆成兩個可編輯區塊，各自存到 `authoredText` 與 `text`;上下順序跟 1.2 接起來的順序一致
- [ ] 2.2 `features/report-draft/`:〈重新產生〉只重算規則那一層，橘字警告與 `confirm` 的文字縮小到只講那一層;元件測試:按過〈重新產生〉之後手寫的內容一個字都沒變
- [ ] 2.3 `features/report-draft/`:「已改過」的判定只看規則那一層;元件測試:只動過手寫層時不顯示橘字
- [ ] 2.4 `features/report-draft/`:〈複製〉複製完整的一份（含手寫那一層）;元件測試斷言剪貼簿拿到的是兩層接起來的內容

## 3. 文件

- [ ] 3.1 `docs/使用說明.md` 第 7 節:改寫〈報告草稿〉，講清楚兩層、〈重新產生〉只動哪一層、代入值只在規則範本裡有效
- [ ] 3.2 `docs/ARCHITECTURE.md`:第一節的 `ReportDraftRecord` 一行補上分層

## 4. 驗收

- [ ] 4.1 `pnpm lint` / `pnpm test` / `pnpm build` 全過
- [ ] 4.2 e2e:在一筆有觸發規則的課節裡，於手寫層寫一段字、改一句規則產生的文字，按〈重新產生〉，確認手寫那段還在、規則那段回到重算的結果，〈複製〉拿到的是完整兩層
